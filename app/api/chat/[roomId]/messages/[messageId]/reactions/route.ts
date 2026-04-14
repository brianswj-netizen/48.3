import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ roomId: string; messageId: string }> }

// POST: 이모티콘 반응 토글 (추가/제거)
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

  // 이미 반응했는지 확인
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // 제거
    await supabase.from('message_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ added: false, emoji })
  } else {
    // 추가
    await supabase.from('message_reactions')
      .insert({ message_id: messageId, user_id: user.id, emoji })
    return NextResponse.json({ added: true, emoji })
  }
}
