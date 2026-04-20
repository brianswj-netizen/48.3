import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('creature_comments')
    .select('id, text, created_at, user:users!user_id(id, name, nickname)')
    .eq('creature_id', id)
    .order('created_at', { ascending: true })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('id, name, nickname').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: comment, error } = await supabase
    .from('creature_comments')
    .insert({ creature_id: id, user_id: user.id, text: text.trim() })
    .select('id, text, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...comment, user })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const url = new URL(req.url)
  const commentId = url.searchParams.get('id')
  if (!commentId) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: comment } = await supabase.from('creature_comments').select('user_id').eq('id', commentId).single()
  if (!comment) return NextResponse.json({ error: '없음' }, { status: 404 })
  if (comment.user_id !== user.id && user.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  await supabase.from('creature_comments').delete().eq('id', commentId)
  return NextResponse.json({ ok: true })
}
