import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import type { ChatRoom } from '@/lib/types'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// ─── 방별 마지막 메시지들 ───
async function getLastMessages(roomId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('chat_messages')
    .select('id, text, created_at, sender:users!sender_id(name, nickname)')
    .eq('room_id', roomId)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(3)
  return (data ?? []).reverse()
}

// ─── 방 목록 ───
async function getRooms(role: string, subgroup: string | null) {
  const supabase = createAdminClient()
  const { data: rooms } = await supabase
    .from('chat_rooms').select('*')
  if (!rooms) return []
  return rooms.filter((room: ChatRoom) => {
    if (role === 'admin') return true
    if (room.type === 'main') return true
    if (room.type === 'subgroup' && room.subgroup_id === subgroup) return true
    return false
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return '방금'
  if (diff < 3_600_000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86_400_000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const ROOM_EMOJI: Record<string, string> = {
  '전체방': '💬', '입문반': '🌱', '실전반': '⚡', '꿀팁과 정보': '✨',
}

// ─── 메인 ───
export default async function LoungePage() {
  const user = await getCurrentUser()
  if (!user) return null

  if (user.role !== 'admin' && !user.subgroup) {
    redirect('/settings?require_subgroup=1')
  }

  const rooms = await getRooms(user.role, user.subgroup)

  // Chat 방 vs Daily Pick 방 분리
  const chatRooms = rooms.filter((r: ChatRoom) => r.name !== '꿀팁과 정보')
  const dailyRooms = rooms.reduce((acc: ChatRoom[], r: ChatRoom) => {
    if (r.name === '꿀팁과 정보' && !acc.length) acc.push(r)
    return acc
  }, [])

  const [chatWithPreview, dailyWithPreview] = await Promise.all([
    Promise.all(chatRooms.map(async (r: ChatRoom) => ({ ...r, messages: await getLastMessages(r.id) }))),
    Promise.all(dailyRooms.map(async (r: ChatRoom) => ({ ...r, messages: await getLastMessages(r.id) }))),
  ])

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#E4C0B0' }}>
        <h1 className="text-xl font-black text-gray-800">라운지</h1>
      </header>

      <div className="flex flex-col pb-8">

        {/* ─── Chat ─── */}
        <SectionHeader emoji="💬" title="Chat" />
        {chatWithPreview.length === 0 ? (
          <div className="mx-4 mb-3 p-3 rounded-2xl bg-gray-50 border border-border text-center">
            <p className="text-xs text-muted">아직 채팅방이 없습니다</p>
          </div>
        ) : (
          chatWithPreview.map(room => <RoomItem key={room.id} room={room} formatTime={formatTime} />)
        )}

        {/* ─── Daily Pick ─── */}
        {dailyWithPreview.length > 0 && (
          <>
            <SectionHeader emoji="✨" title="Daily Pick" />
            {dailyWithPreview.map(room => <RoomItem key={room.id} room={room} formatTime={formatTime} featured />)}
          </>
        )}

        {/* ─── 삽질기 ─── */}
        <SectionHeader emoji="🔧" title="삽질기" href="/sapjil" />
        <Link href="/sapjil">
          <div className="mx-4 mb-3 p-3 rounded-[14px] hover:bg-gray-50 active:bg-gray-100 transition-colors"
            style={{ background: 'white', border: '0.5px solid var(--border)' }}>
            <p className="text-xs text-muted text-center">맞닥뜨린 문제와 해결책, 경험을 공유하는 공간 →</p>
          </div>
        </Link>

      </div>
    </div>
  )
}

// ─── 섹션 헤더 ───
function SectionHeader({ emoji, title, href }: { emoji: string; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-2">
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{title}</span>
      </div>
      {href && (
        <Link href={href} className="text-[11px] font-medium" style={{ color: 'var(--purple)' }}>
          전체보기
        </Link>
      )}
    </div>
  )
}

// ─── 방 아이템 ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RoomItem({ room, formatTime, featured = false }: { room: any; formatTime: (s: string) => string; featured?: boolean }) {
  const emoji = ROOM_EMOJI[room.name] ?? '💬'
  const messages: any[] = room.messages ?? []
  const lastMsg = messages[messages.length - 1]
  const time = lastMsg ? formatTime(lastMsg.created_at) : ''

  return (
    <Link href={`/chat/${room.id}`}>
      <div className={`mx-4 mb-1.5 rounded-[14px] px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors`}
        style={{ background: featured ? 'linear-gradient(135deg,#FDF8FF,#F5F0FF)' : 'white', border: featured ? '0.5px solid #DDD6FE' : '0.5px solid var(--border)' }}>
        {/* 방 이름 + 시간 */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
            style={{ background: featured ? '#EDE9FE' : 'var(--purple-light)' }}>
            {emoji}
          </div>
          <div className="flex-1 flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-gray-900">{room.name}</span>
            {time && <span className="text-[11px] text-muted shrink-0">{time}</span>}
          </div>
        </div>
        {/* 최근 메시지 3개 */}
        {messages.length === 0 ? (
          <p className="text-xs text-muted ml-[42px]">아직 메시지가 없습니다</p>
        ) : (
          <div className="ml-[42px] flex flex-col gap-0.5">
            {messages.map((msg: any, i: number) => {
              const senderRaw = msg.sender
              const sender = Array.isArray(senderRaw) ? senderRaw[0] : senderRaw
              const senderName = sender?.name ?? sender?.nickname ?? ''
              const rawText = msg.text ?? ''
              const previewText = rawText.startsWith('__DAILY_CARD__:') ? '📰 오늘의 카드' : rawText
              const isLast = i === messages.length - 1
              return (
                <p key={msg.id} className={`text-xs truncate leading-relaxed ${isLast ? 'text-gray-700 font-medium' : 'text-muted'}`}>
                  {senderName && <span className="font-semibold">{senderName}: </span>}
                  {previewText}
                </p>
              )
            })}
          </div>
        )}
      </div>
    </Link>
  )
}
