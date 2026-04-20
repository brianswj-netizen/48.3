import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

// PATCH: edit post
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const { title, content } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: '제목 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: post } = await supabase
    .from('sapjil_posts').select('author_id').eq('id', id).single()
  if (!post) return NextResponse.json({ error: '게시물 없음' }, { status: 404 })
  if (post.author_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { data: updated, error } = await supabase
    .from('sapjil_posts')
    .update({ title: title.trim(), content: content?.trim() ?? '' })
    .eq('id', id)
    .select('id, title, content, image_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
}

// DELETE: delete post
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: post } = await supabase
    .from('sapjil_posts').select('author_id').eq('id', id).single()
  if (!post) return NextResponse.json({ error: '게시물 없음' }, { status: 404 })
  if (post.author_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  await supabase.from('sapjil_posts').delete().eq('id', id)
  revalidateTag('home', {})
  return NextResponse.json({ ok: true })
}
