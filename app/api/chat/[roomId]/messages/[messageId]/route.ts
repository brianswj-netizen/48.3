import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ roomId: string; messageId: string }> }

// PATCH: 메시지 수정 (본인만)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId)
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { messageId } = await params
  const { text } = await req.json()
  if (!text?.trim())
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: msg } = await supabase
    .from('chat_messages').select('sender_id').eq('id', messageId).single()
  if (!msg || msg.sender_id !== user.id)
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ text: text.trim(), edited: true })
    .eq('id', messageId)
    .select('id, text, edited')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: 메시지 삭제 (본인 또는 admin)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId)
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { messageId } = await params
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: msg } = await supabase
    .from('chat_messages').select('sender_id').eq('id', messageId).single()
  if (!msg) return NextResponse.json({ error: '메시지 없음' }, { status: 404 })

  if (msg.sender_id !== user.id && user.role !== 'admin')
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { error } = await supabase
    .from('chat_messages').update({ deleted: true }).eq('id', messageId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
