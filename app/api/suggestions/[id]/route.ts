import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId)
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, description, category, image_url } = body

  if (!title?.trim())
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: suggestion } = await supabase
    .from('suggestions')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!suggestion) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  if (user.role !== 'admin' && suggestion.author_id !== user.id)
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { data, error } = await supabase
    .from('suggestions')
    .update({ title: title.trim(), description: description?.trim() ?? null, category: category ?? null, image_url: image_url ?? null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId)
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: suggestion } = await supabase
    .from('suggestions')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!suggestion) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  if (user.role !== 'admin' && suggestion.author_id !== user.id)
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { error } = await supabase.from('suggestions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
