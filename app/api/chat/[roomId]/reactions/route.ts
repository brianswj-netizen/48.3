import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ roomId: string }> }

// GET: 해당 채팅방 모든 메시지의 이모티콘 반응 조회
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId)
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { roomId } = await params
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({})

  // 해당 방의 모든 메시지 id 가져오기
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('room_id', roomId)
    .eq('deleted', false)

  if (!messages || messages.length === 0) return NextResponse.json({})

  const messageIds = messages.map(m => m.id)

  // 반응 전체 조회
  const { data: reactions } = await supabase
    .from('message_reactions')
    .select('message_id, user_id, emoji')
    .in('message_id', messageIds)

  if (!reactions) return NextResponse.json({})

  // messageId → { emoji → { count, mine } } 구조로 변환
  const result: Record<string, { emoji: string; count: number; mine: boolean }[]> = {}
  for (const r of reactions) {
    if (!result[r.message_id]) result[r.message_id] = []
    const existing = result[r.message_id].find(x => x.emoji === r.emoji)
    if (existing) {
      existing.count++
      if (r.user_id === user.id) existing.mine = true
    } else {
      result[r.message_id].push({ emoji: r.emoji, count: 1, mine: r.user_id === user.id })
    }
  }

  return NextResponse.json(result)
}
