import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ roomId: string; messageId: string }> }

// GET: 댓글 목록
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { messageId } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('message_comments')
    .select('id, text, created_at, user:users!user_id(id, name, nickname, avatar_url)')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

// POST: 댓글 작성
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { messageId } = await params
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'text 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id, name, nickname, avatar_url').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: comment, error } = await supabase
    .from('message_comments')
    .insert({ message_id: messageId, user_id: user.id, text: text.trim() })
    .select('id, text, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...comment, user })
}

// DELETE: 댓글 삭제 (?id=commentId)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { messageId } = await params
  const commentId = req.nextUrl.searchParams.get('id')
  if (!commentId) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: comment } = await supabase
    .from('message_comments').select('user_id').eq('id', commentId).eq('message_id', messageId).single()

  if (!comment) return NextResponse.json({ error: '댓글 없음' }, { status: 404 })
  if (comment.user_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  await supabase.from('message_comments').delete().eq('id', commentId)
  return NextResponse.json({ ok: true })
}
