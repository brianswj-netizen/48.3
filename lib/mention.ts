/**
 * @멘션 감지 + mention_notifications 저장 공용 유틸리티
 * 채팅·제안댓글·공지댓글·일정댓글 API에서 공통 사용
 */
import { createAdminClient } from '@/lib/supabase/admin'

type SourceType = 'suggestion_comment' | 'announcement_comment' | 'event_comment'

export async function saveMentionNotifications({
  text,
  senderId,
  sourceType,
  sourceId,
}: {
  text: string
  senderId: string
  sourceType: SourceType
  sourceId: string
}) {
  try {
    const mentionRegex = /@([^\s@,!?。]+)/g
    const mentionNames: string[] = []
    let m: RegExpExecArray | null
    while ((m = mentionRegex.exec(text)) !== null) mentionNames.push(m[1])
    if (mentionNames.length === 0) return

    const supabase = createAdminClient()
    const orFilter = mentionNames
      .flatMap(n => [`name.eq.${n}`, `nickname.eq.${n}`])
      .join(',')
    const { data: mentionedUsers } = await supabase
      .from('users').select('id').or(orFilter)
    if (!mentionedUsers?.length) return

    const notifications = mentionedUsers
      .filter((u: { id: string }) => u.id !== senderId)
      .map((u: { id: string }) => ({
        mentioned_user_id: u.id,
        sender_id: senderId,
        room_id: sourceId,       // source ID (제안/공지/일정 ID)
        room_name: sourceType,   // source 타입 식별자
        message_text: text.slice(0, 100),
      }))

    if (notifications.length > 0)
      await supabase.from('mention_notifications').insert(notifications)
  } catch {
    // 알림 실패는 댓글 저장에 영향 없음
  }
}

/** room_name → 한국어 라벨 */
export function mentionSourceLabel(roomName: string): string {
  if (roomName === 'suggestion_comment') return '제안 댓글'
  if (roomName === 'announcement_comment') return '공지 댓글'
  if (roomName === 'event_comment') return '일정 댓글'
  return roomName  // 채팅 방 이름 그대로
}

/** room_name → 이동할 href */
export function mentionSourceHref(roomName: string, roomId: string | null): string {
  if (roomName === 'suggestion_comment') return '/suggestions'
  if (roomName === 'announcement_comment') return '/announcements'
  if (roomName === 'event_comment') return '/calendar'
  return roomId ? `/chat/${roomId}` : '/chat'
}
