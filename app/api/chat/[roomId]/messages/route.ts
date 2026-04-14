import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: 메시지 목록 가져오기
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { roomId } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      id, room_id, sender_id, text, edited, deleted, created_at,
      sender:users!sender_id (id, name, nickname, avatar_url)
    `)
    .eq('room_id', roomId)
    .eq('deleted', false)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: 메시지 전송
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { roomId } = await params
  const { text } = await req.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 현재 유저 조회
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user) return NextResponse.json({ error: '유저를 찾을 수 없습니다.' }, { status: 404 })

  // 메시지 저장
  const { data: message, error } = await supabase
    .from('chat_messages')
    .insert({ room_id: roomId, sender_id: user.id, text: text.trim() })
    .select(`
      id, room_id, sender_id, text, edited, deleted, created_at,
      sender:users!sender_id (id, name, nickname, avatar_url)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // @멘션 감지 및 알림 생성
  try {
    const mentionRegex = /@([^\s@,!?。]+)/g
    const mentionNames: string[] = []
    let m: RegExpExecArray | null
    while ((m = mentionRegex.exec(text.trim())) !== null) mentionNames.push(m[1])

    if (mentionNames.length > 0) {
      // 이름 또는 닉네임이 일치하는 유저 조회
      const orFilter = mentionNames.flatMap(n => [`name.eq.${n}`, `nickname.eq.${n}`]).join(',')
      const { data: mentionedUsers } = await supabase
        .from('users').select('id').or(orFilter)

      if (mentionedUsers && mentionedUsers.length > 0) {
        const { data: room } = await supabase
          .from('chat_rooms').select('name').eq('id', roomId).single()
        const notifications = mentionedUsers
          .filter((u: { id: string }) => u.id !== user.id)
          .map((u: { id: string }) => ({
            mentioned_user_id: u.id,
            sender_id: user.id,
            message_id: message.id,
            room_id: roomId,
            message_text: text.trim().slice(0, 100),
            room_name: room?.name ?? '',
          }))
        if (notifications.length > 0)
          await supabase.from('mention_notifications').insert(notifications)
      }
    }
  } catch {
    // 알림 생성 실패는 메시지 전송에 영향 없음
  }

  return NextResponse.json(message)
}
