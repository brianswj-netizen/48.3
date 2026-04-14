import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import NotificationsSection from '@/components/NotificationsSection'
import { CrewScoreBadge } from '@/components/CrewScoreCard'

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

function ddayLabel(deadline: string | null) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return null
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
      .limit(20)
    return data ?? []
  } catch {
    return []
  }
}

// 30초 캐시
function getCachedHomeData(subgroup: string | null, role: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const today = new Date().toISOString().split('T')[0]

      const [announcementsRes, eventsRes, votesRes] = await Promise.all([
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
        supabase
          .from('votes')
          .select('id, title, deadline')
          .or(`deadline.is.null,deadline.gte.${today}`)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      return {
        announcements: announcementsRes.data ?? [],
        events: eventsRes.data ?? [],
        activeVotes: votesRes.data ?? [],
      }
    },
    [`home-data-${subgroup ?? 'none'}-${role}`],
    { revalidate: 30, tags: ['home', 'announcements', 'events', 'votes'] }
  )()
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const [{ announcements, events, activeVotes }, unreadMentions] = await Promise.all([
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

        {/* 크루 점수 배지 */}
        {user && (
          <div className="mt-3">
            <CrewScoreBadge score={user.score ?? 0} level={user.level ?? 1} />
          </div>
        )}
      </header>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* 알림 */}
        <NotificationsSection notifications={unreadMentions as any} />

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

        {/* 다음 일정 */}
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

      </div>
    </div>
  )
}
