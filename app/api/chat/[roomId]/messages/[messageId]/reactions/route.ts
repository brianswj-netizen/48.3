import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ roomId: string; messageId: string }> }

// POST: 이모티콘 반응 토글 (추가/제거) — 유저당 하나만 허용, 본인 메시지 불가
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId)
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { messageId } = await params
  const { emoji } = await req.json()
  if (!emoji) return NextResponse.json({ error: 'emoji 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  // 본인 메시지에는 리액션 불가
  const { data: msg } = await supabase
    .from('chat_messages').select('sender_id').eq('id', messageId).single()
  if (msg?.sender_id === user.id) {
    return NextResponse.json({ error: '본인 메시지에는 리액션할 수 없습니다' }, { status: 403 })
  }

  // 이 유저의 기존 리액션 (이모지 종류 무관 — 하나만 허용)
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id, emoji')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.emoji === emoji) {
    // 같은 이모지 클릭 → 토글 off
    await supabase.from('message_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ added: false, emoji, previousEmoji: null })
  }

  // 다른 이모지 → 기존 삭제 후 새로 추가
  if (existing) {
    await supabase.from('message_reactions').delete().eq('id', existing.id)
  }
  await supabase.from('message_reactions')
    .insert({ message_id: messageId, user_id: user.id, emoji })
  return NextResponse.json({ added: true, emoji, previousEmoji: existing?.emoji ?? null })
}
