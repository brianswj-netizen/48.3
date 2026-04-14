import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import type { ChatRoom } from '@/lib/types'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function getRooms(role: string, subgroup: string | null) {
  const supabase = createAdminClient()
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('type', { ascending: true })

  if (!rooms) return []

  return rooms.filter((room: ChatRoom) => {
    if (role === 'admin') return true
    if (room.type === 'main') return true
    if (room.type === 'subgroup' && room.subgroup_id === subgroup) return true
    return false
  })
}

async function getLastMessage(roomId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('chat_messages')
    .select('text, created_at, sender:users!sender_id(name, nickname)')
    .eq('room_id', roomId)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

function formatTime(iso: string) {
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

export default async function ChatPage() {
  const user = await getCurrentUser()
  if (!user) return null

  // 어드민이 아닌 경우 소모임 미선택 시 설정 페이지로 강제 이동
  if (user.role !== 'admin' && !user.subgroup) {
    redirect('/settings?require_subgroup=1')
  }

  const rooms = await getRooms(user.role, user.subgroup)
  const roomsWithPreview = await Promise.all(
    rooms.map(async (room: ChatRoom) => ({ ...room, last: await getLastMessage(room.id) }))
  )

  const mainRooms = roomsWithPreview.filter(r => r.type === 'main')
  const subRooms = roomsWithPreview.filter(r => r.type === 'subgroup')

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#E4C0B0' }}>
        <h1 className="text-xl font-black text-gray-800">채팅</h1>
      </header>

      <div className="flex flex-col">
        {/* 전체 채팅방 */}
        <p className="px-5 pt-4 pb-2 text-xs font-semibold text-muted uppercase tracking-wider">전체</p>
        {mainRooms.map(room => <RoomItem key={room.id} room={room} />)}

        {/* 소모임 채팅방 */}
        {subRooms.length > 0 && (
          <>
            <p className="px-5 pt-4 pb-2 text-xs font-semibold text-muted uppercase tracking-wider">소모임</p>
            {subRooms.map(room => <RoomItem key={room.id} room={room} />)}
          </>
        )}

        {/* 소모임 미가입 안내 */}
        {subRooms.length === 0 && user.role !== 'admin' && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-gray-50 border border-border text-center">
            <p className="text-sm text-muted">소모임에 가입하면 소모임 채팅방을 이용할 수 있어요</p>
            <p className="text-xs text-muted mt-1">설정 → 소모임 선택</p>
          </div>
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RoomItem({ room }: { room: any }) {
  const emoji = ROOM_EMOJI[room.name] ?? '💬'
  const sender = Array.isArray(room.last?.sender) ? room.last.sender[0] : room.last?.sender
  const senderName = sender?.name ?? sender?.nickname ?? ''
  const rawText = room.last?.text ?? ''
  const previewText = rawText.startsWith('__DAILY_CARD__:') ? '📰 오늘의 AI 카드' : rawText
  const preview = room.last ? `${senderName}: ${previewText}` : '아직 메시지가 없습니다'
  const time = room.last ? formatTime(room.last.created_at) : ''

  return (
    <Link href={`/chat/${room.id}`}>
      <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-border/50">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl"
          style={{ background: 'var(--purple-light)' }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-gray-900">{room.name}</span>
            {time && <span className="text-[11px] text-muted shrink-0">{time}</span>}
          </div>
          <p className="text-xs text-muted truncate mt-0.5">{preview}</p>
        </div>
      </div>
    </Link>
  )
}
