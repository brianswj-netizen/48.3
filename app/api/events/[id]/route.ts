import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('role').eq('kakao_id', session.user.kakaoId).single()
  if (user?.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { title, place, event_date, event_time, notes } = body

  const { data, error } = await supabase
    .from('events')
    .update({ title, place: place || null, event_date, event_time: event_time || null, notes: notes || null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
    .select('role')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (user?.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
