import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: creature } = await supabase.from('creatures').select('author_id').eq('id', id).single()
  if (!creature) return NextResponse.json({ error: '없음' }, { status: 404 })
  if (creature.author_id !== user.id && user.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { title, description, content, url, image_url, status, version } = await req.json()
  const { error } = await supabase.from('creatures').update({
    title: title?.trim(),
    description: description?.trim() || null,
    content: content?.trim() || null,
    url: url?.trim() || null,
    image_url: image_url ?? null,
    status: status ?? '기획안',
    version: version?.trim() || null,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: creature } = await supabase.from('creatures').select('author_id').eq('id', id).single()
  if (!creature) return NextResponse.json({ error: '없음' }, { status: 404 })
  if (creature.author_id !== user.id && user.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  await supabase.from('creatures').delete().eq('id', id)
  revalidateTag('home', {})
  return NextResponse.json({ ok: true })
}
