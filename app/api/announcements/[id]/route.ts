import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return null
  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('kakao_id', session.user.kakaoId)
    .single()
  return user?.role === 'admin' ? supabase : null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  // 핀 토글 요청
  if ('pin' in body) {
    if (body.pin) {
      // 현재 핀된 개수 확인 (최대 3개)
      const { count } = await supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('is_pinned', true)
        .neq('id', id)
      if ((count ?? 0) >= 3) {
        return NextResponse.json({ error: '상단 고정은 최대 3개까지 가능합니다.' }, { status: 400 })
      }
      await supabase.from('announcements').update({ is_pinned: true, pinned_at: new Date().toISOString() }).eq('id', id)
    } else {
      await supabase.from('announcements').update({ is_pinned: false, pinned_at: null }).eq('id', id)
    }
    revalidateTag('announcements', {})
    return NextResponse.json({ ok: true })
  }

  // 내용 수정 요청
  const { title, content, image_url } = body
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('announcements')
    .update({ title: title.trim(), content: content.trim(), image_url: image_url ?? null })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('announcements', {})
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('announcements', {})
  return NextResponse.json({ ok: true })
}
