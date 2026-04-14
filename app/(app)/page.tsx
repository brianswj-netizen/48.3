import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import { mentionSourceLabel, mentionSourceHref } from '@/lib/mention'

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    monthNum: d.getMonth() + 1,
    day: d.getDate(),
  }
}

function formatTime(time: string | null) {
  if (!time) return ''
  return time.slice(0, 5)
}

function formatAnnouncementDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    if (hours < 1) return '방금'
    return `${hours}시간 전`
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}일 전`
  }
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function formatChatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60 * 1000) return '방금'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 24 * 60 * 60 * 1000)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const ROOM_EMOJI: Record<string, string> = {
  '전체방': '💬', '입문반': '🌱', '중급반': '⚡', '고급반': '🚀',
}

// 여러 방의 마지막 메시지를 한 번의 쿼리로 일괄 조회 (속도 개선)
async function getLastMessages(
  supabase: ReturnType<typeof createAdminClient>,
  roomIds: string[]
) {
  if (roomIds.length === 0) return {}
  const { data } = await supabase
    .from('chat_messages')
    .select('room_id, text, created_at, sender:users!sender_id(name, nickname)')
    .in('room_id', roomIds)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(roomIds.length * 5)

  const byRoom: Record<string, { text: string; created_at: string; sender: unknown }> = {}
  for (const msg of (data ?? [])) {
    if (!byRoom[msg.room_id]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const senderRaw = msg.sender as any
      const sender = Array.isArray(senderRaw) ? senderRaw[0] : senderRaw
      byRoom[msg.room_id] = { text: msg.text, created_at: msg.created_at, sender }
    }
  }
  return byRoom
}

function ddayLabel(deadline: string | null) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return null  // expired — don't show
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
}

async function getUnreadMentions(userId: string) {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('mention_notifications')
      .select('id, message_text, room_name, room_id, sender:users!sender_id(name, nickname)')
      .eq('mentioned_user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(3)
    return data ?? []
  } catch {
    return []
  }
}

// subgroup + role 조합이 적어서 (입문/중급/고급/null × member/admin = 8가지)
// 각 조합을 30초 캐시 → 동일 소모임 멤버들은 DB 1회만 조회
function getCachedHomeData(subgroup: string | null, role: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const today = new Date().toISOString().split('T')[0]

      const roomQuery = supabase.from('chat_rooms').select('id, name, type, subgroup_id')

      const [announcementsRes, eventsRes, roomsRes, votesRes] = await Promise.all([
        supabase
          .from('announcements')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('events')
          .select('id, title, place, event_date, event_time')
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(2),
        roomQuery,
        supabase
          .from('votes')
          .select('id, title, deadline')
          .or(`deadline.is.null,deadline.gte.${today}`)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      const allRooms = roomsRes.data ?? []
      const visibleRooms = allRooms.filter((r) => {
        if (role === 'admin') return true
        if (r.type === 'main') return true
        if (r.type === 'subgroup' && r.subgroup_id === subgroup) return true
        return false
      })

      const lastMessages = await getLastMessages(supabase, visibleRooms.map(r => r.id))
      const roomsWithPreview = visibleRooms.map(room => ({
        ...room,
        last: lastMessages[room.id] ?? null,
      }))

      return {
        announcements: announcementsRes.data ?? [],
        events: eventsRes.data ?? [],
        chatRooms: roomsWithPreview,
        activeVotes: votesRes.data ?? [],
      }
    },
    [`home-data-${subgroup ?? 'none'}-${role}`],
    { revalidate: 30, tags: ['home', 'announcements', 'events', 'votes'] }
  )()
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const [{ announcements, events, chatRooms, activeVotes }, unreadMentions] = await Promise.all([
    getCachedHomeData(user?.subgroup ?? null, user?.role ?? 'member'),
    user?.id ? getUnreadMentions(user.id) : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <header
        className="px-5 pt-12 pb-5 md:pt-6"
        style={{ background: 'var(--navy)' }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-white font-black tracking-tight leading-tight">
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#A78BFA', letterSpacing: '-0.02em' }}>AI</span>
            <span className="text-2xl"> Survival Crew</span>
          </h1>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--purple)', color: 'white' }}
          >
            Season 1
          </span>
        </div>
        <p className="text-white/60 text-sm mt-1">건국대 부동산대학원</p>
      </header>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* @멘션 알림 */}
        {unreadMentions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-base font-bold text-gray-900">💬 새 멘션</h2>
            </div>
            <div
              className="rounded-[14px] divide-y overflow-hidden"
              style={{ border: '0.5px solid #C4B5FD', background: '#F5F3FF' }}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {unreadMentions.map((n: any) => {
                const senderRaw = n.sender
                const sender = Array.isArray(senderRaw) ? senderRaw[0] : senderRaw
                const senderName = sender?.name ?? sender?.nickname ?? '누군가'
                const sourceLabel = mentionSourceLabel(n.room_name ?? '')
                const href = mentionSourceHref(n.room_name ?? '', n.room_id)
                return (
                  <Link key={n.id} href={href}>
                    <div className="px-4 py-3 hover:bg-purple-50 transition-colors">
                      <p className="text-xs font-semibold" style={{ color: 'var(--purple)' }}>
                        {senderName}님이 {sourceLabel}에서 언급했어요
                      </p>
                      <p className="text-xs text-gray-700 mt-0.5 truncate">{n.message_text}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* 공지사항 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-base font-bold text-gray-900">공지사항</h2>
            <Link href="/announcements" className="text-xs font-medium" style={{ color: 'var(--purple)' }}>
              전체보기
            </Link>
          </div>
          <div
            className="bg-white rounded-[14px] divide-y divide-border overflow-hidden"
            style={{ border: '0.5px solid var(--border)' }}
          >
            {announcements.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted">아직 공지사항이 없습니다.</p>
              </div>
            ) : (
              announcements.map((item) => (
                <Link key={item.id} href="/announcements">
                  <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{item.title}</p>
                    <p className="text-xs text-muted mt-0.5">{formatAnnouncementDate(item.created_at)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* 일정 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-base font-bold text-gray-900">다음 일정</h2>
            <Link href="/calendar" className="text-xs font-medium" style={{ color: 'var(--purple)' }}>
              전체보기
            </Link>
          </div>
          <div
            className="bg-white rounded-[14px] divide-y divide-border overflow-hidden"
            style={{ border: '0.5px solid var(--border)' }}
          >
            {events.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted">예정된 일정이 없습니다.</p>
              </div>
            ) : (
              events.map((event) => {
                const { monthNum, day } = formatEventDate(event.event_date)
                return (
                  <Link key={event.id} href="/calendar" className="px-4 py-3 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center min-w-[36px]">
                      <span className="text-[11px] font-medium text-muted leading-none">{monthNum}월</span>
                      <span
                        className="text-2xl font-black leading-tight"
                        style={{ color: 'var(--purple)' }}
                      >
                        {day}
                      </span>
                      {event.event_time && (
                        <span className="text-[11px] text-muted leading-none">{formatTime(event.event_time)}</span>
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                      {event.place && (
                        <p className="text-xs text-muted mt-0.5">📍 {event.place}</p>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </section>

        {/* 진행 중인 투표 */}
        {activeVotes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-base font-bold text-gray-900">🗳️ 진행 중인 투표</h2>
              <Link href="/votes" className="text-xs font-medium" style={{ color: 'var(--purple)' }}>
                전체보기
              </Link>
            </div>
            <div
              className="bg-white rounded-[14px] divide-y divide-border overflow-hidden"
              style={{ border: '0.5px solid var(--border)' }}
            >
              {activeVotes.map((vote) => {
                const dday = ddayLabel(vote.deadline)
                return (
                  <Link key={vote.id} href="/votes">
                    <div className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{vote.title}</p>
                      </div>
                      {dday && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'var(--coral-light)', color: 'var(--coral)' }}>
                          {dday}
                        </span>
                      )}
                      <span className="text-muted shrink-0">›</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* 채팅 */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-base font-bold text-gray-900">채팅</h2>
            <Link href="/chat" className="text-xs font-medium" style={{ color: 'var(--purple)' }}>
              전체보기
            </Link>
          </div>
          <div
            className="bg-white rounded-[14px] divide-y divide-border overflow-hidden"
            style={{ border: '0.5px solid var(--border)' }}
          >
            {chatRooms.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted">채팅방이 없습니다.</p>
              </div>
            ) : (
              chatRooms.map((room) => {
                const emoji = ROOM_EMOJI[room.name] ?? '💬'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sender = Array.isArray((room.last?.sender as any))
                  ? (room.last?.sender as any)[0]
                  : room.last?.sender
                const senderName = sender?.name ?? sender?.nickname ?? ''
                const rawText = room.last?.text ?? ''
                const previewText = rawText.startsWith('__DAILY_CARD__:') ? '📰 오늘의 AI 카드' : rawText
                const preview = room.last ? `${senderName}: ${previewText}` : '아직 메시지가 없습니다'
                const time = room.last ? formatChatTime(room.last.created_at) : ''

                return (
                  <Link key={room.id} href={`/chat/${room.id}`}>
                    <div className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'var(--purple-light)' }}
                      >
                        <span className="text-lg">{emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{room.name}</p>
                          {time && <span className="text-[11px] text-muted shrink-0">{time}</span>}
                        </div>
                        <p className="text-xs text-muted truncate mt-0.5">{preview}</p>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
