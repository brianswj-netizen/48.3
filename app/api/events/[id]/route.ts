import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { id } = await params

  // 작성자 또는 어드민만 수정 가능
  const { data: event } = await supabase.from('events').select('created_by').eq('id', id).single()
  if (!event) return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })
  if (user.role !== 'admin' && event.created_by !== user.id)
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const body = await req.json()
  const { title, place, event_date, event_time, notes } = body

  const { data, error } = await supabase
    .from('events')
    .update({ title, place: place || null, event_date, event_time: event_time || null, notes: notes || null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/calendar')
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { id } = await params

  // 작성자 또는 어드민만 삭제 가능
  const { data: event } = await supabase.from('events').select('created_by').eq('id', id).single()
  if (!event) return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })
  if (user.role !== 'admin' && event.created_by !== user.id)
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/calendar')
  return NextResponse.json({ ok: true })
}
