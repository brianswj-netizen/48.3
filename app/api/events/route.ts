import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
  }

  const body = await req.json()
  const { title, place, notes, event_date, event_time, image_url } = body

  if (!title?.trim() || !event_date) {
    return NextResponse.json({ error: '제목과 날짜를 입력해주세요.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('events')
    .insert({
      title: title.trim(),
      place: place?.trim() || null,
      notes: notes?.trim() || null,
      event_date,
      event_time: event_time || null,
      image_url: image_url || null,
      created_by: user.id,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
