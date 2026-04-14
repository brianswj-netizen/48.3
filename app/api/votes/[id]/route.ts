import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

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

  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: '관리자만 투표를 삭제할 수 있습니다.' }, { status: 403 })

  // Delete related data first (vote_options, vote_responses cascade via FK or manual)
  await supabase.from('vote_responses').delete().eq('vote_id', id)
  await supabase.from('vote_options').delete().eq('vote_id', id)
  const { error } = await supabase.from('votes').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
