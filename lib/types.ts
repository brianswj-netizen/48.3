// 공유 타입 정의

export type ChatRoom = {
  id: string
  name: string
  type: 'main' | 'subgroup'
  subgroup_id: string | null
}

export type MessageSender = {
  id: string
  name: string | null
  nickname: string | null
  avatar_url: string | null
}

export type Message = {
  id: string
  room_id: string
  sender_id: string
  text: string
  edited: boolean
  deleted: boolean
  created_at: string
  sender: MessageSender | null
}

export type ChatRoomWithPreview = ChatRoom & {
  lastMessage?: string
  lastTime?: string
  unreadCount?: number
}
