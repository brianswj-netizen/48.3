import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('votes')
    .select('*, vote_options(*), vote_responses(user_id)')
    .order('created_at', { ascending: false })
    .limit(20)

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
    return NextResponse.json({ error: '관리자만 투표를 만들 수 있습니다.' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, deadline, options } = body

  if (!title?.trim() || !options?.length || options.length < 2) {
    return NextResponse.json({ error: '제목과 선택지를 2개 이상 입력해주세요.' }, { status: 400 })
  }

  const { data: vote, error: voteError } = await supabase
    .from('votes')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      deadline: deadline || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (voteError || !vote) {
    return NextResponse.json({ error: voteError?.message ?? '투표 생성 실패' }, { status: 500 })
  }

  const optionRows = options
    .filter((o: string) => o?.trim())
    .map((o: string) => ({ vote_id: vote.id, text: o.trim() }))

  const { error: optError } = await supabase.from('vote_options').insert(optionRows)
  if (optError) return NextResponse.json({ error: optError.message }, { status: 500 })

  revalidateTag('votes', {})

  return NextResponse.json({ ok: true, id: vote.id })
}
