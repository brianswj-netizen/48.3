import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:users!created_by(name, nickname)')
    .order('created_at', { ascending: false })
    .limit(30)

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
    .select('id, role')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '관리자만 공지사항을 작성할 수 있습니다.' }, { status: 403 })
  }

  const body = await req.json()
  const { title, content } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('announcements')
    .insert({ title: title.trim(), content: content.trim(), created_by: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('announcements', {})
  return NextResponse.json({ ok: true })
}
