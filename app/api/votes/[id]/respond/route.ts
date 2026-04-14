import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: voteId } = await params
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
  const { option_id } = body

  if (!option_id) return NextResponse.json({ error: '선택지를 골라주세요.' }, { status: 400 })

  // 마감 확인
  const { data: vote } = await supabase
    .from('votes')
    .select('deadline')
    .eq('id', voteId)
    .single()

  if (vote?.deadline && new Date(vote.deadline) < new Date()) {
    return NextResponse.json({ error: '마감된 투표입니다.' }, { status: 400 })
  }

  // 기존 응답 삭제 후 새로 INSERT (변경 허용)
  await supabase
    .from('vote_responses')
    .delete()
    .eq('vote_id', voteId)
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('vote_responses')
    .insert({ vote_id: voteId, option_id, user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
