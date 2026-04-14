import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*, uploader:users!uploader_id(name, nickname)')
    .order('created_at', { ascending: false })
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

  if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

  const body = await req.json()
  const { title, url, tag } = body

  if (!title?.trim() || !url?.trim()) {
    return NextResponse.json({ error: '제목과 링크를 입력해주세요.' }, { status: 400 })
  }

  const validTags = ['텍스트AI', '이미지AI', '자동화', '부동산×AI']
  if (tag && !validTags.includes(tag)) {
    return NextResponse.json({ error: '올바른 태그를 선택해주세요.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('documents')
    .insert({ title: title.trim(), url: url.trim(), tag: tag || null, uploader_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
