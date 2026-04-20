import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import ChatRoomClient from '@/components/chat/ChatRoomClient'
import MemberListButton from '@/components/chat/MemberListButton'
import type { Message } from '@/lib/types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

async function getRoom(roomId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('id', roomId)
    .single()
  return data
}


async function getRoomMembers(room: { type: string; subgroup_id: string | null }) {
  const supabase = createAdminClient()
  let query = supabase
    .from('users')
    .select('id, name, nickname, avatar_url, subgroup, role')
    .eq('status', 'approved')
    .not('kakao_id', 'like', 'pre_%')
    .not('kakao_id', 'like', 'system_%')

  // 소모임방이면 해당 소모임 멤버 + 관리자만
  if (room.type === 'subgroup' && room.subgroup_id) {
    query = query.or(`subgroup.eq.${room.subgroup_id},role.eq.admin`)
  }

  const { data } = await query.order('role', { ascending: false }).order('name')
  return data ?? []
}

async function getInitialMessages(roomId: string): Promise<Message[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('chat_messages')
    .select(`
      id, room_id, sender_id, text, edited, deleted, created_at,
      sender:users!sender_id (id, name, nickname, avatar_url)
    `)
    .eq('room_id', roomId)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(50)

  return ((data ?? []).reverse()) as unknown as Message[]
}

const ROOM_EMOJI: Record<string, string> = {
  '전체방': '💬', '입문반': '🌱', '실전반': '⚡',
}

export default async function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const [user, room, initialMessages] = await Promise.all([
    getCurrentUser(),
    getRoom(roomId),
    getInitialMessages(roomId),
  ])

  const roomMembers = room ? await getRoomMembers(room) : []

  // 이 방의 멘션 알림 읽음 처리
  if (user) {
    try {
      const supabase = createAdminClient()
      const { data: unread } = await supabase
        .from('mention_notifications')
        .select('id')
        .eq('mentioned_user_id', user.id)
        .eq('room_id', roomId)
        .eq('is_read', false)
      if (unread && unread.length > 0) {
        await supabase
          .from('mention_notifications')
          .update({ is_read: true })
          .in('id', unread.map((n: { id: string }) => n.id))
      }
    } catch {
      // 알림 처리 실패 무시
    }
  }

  if (!user) redirect('/login')
  if (!room) notFound()

  // 소모임방 접근 권한 확인
  if (room.type === 'subgroup' && user.role !== 'admin') {
    if (room.subgroup_id !== user.subgroup) redirect('/chat')
  }

  const emoji = ROOM_EMOJI[room.name] ?? '💬'

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-0px)]">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-3 md:pt-4 bg-white border-b border-border shrink-0">
        <Link href="/chat" className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} className="text-gray-700" />
        </Link>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: 'var(--purple-light)' }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 text-base leading-tight">{room.name}</h1>
        </div>
        <MemberListButton members={roomMembers} roomName={room.name} />
      </header>

      {/* 채팅 (실시간) */}
      <div className="flex-1 min-h-0">
        <ChatRoomClient
          roomId={roomId}
          roomName={room.name}
          initialMessages={initialMessages}
          currentUserId={user.id}
          isAdmin={user.role === 'admin'}
          members={roomMembers}
        />
      </div>
    </div>
  )
}
