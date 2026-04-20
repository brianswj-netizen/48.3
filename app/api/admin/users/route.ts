import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (me?.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const url = new URL(req.url)
  const all = url.searchParams.get('all') === 'true'

  let query = supabase
    .from('users')
    .select('id, name, nickname, avatar_url, status, created_at, kakao_id, subgroup, role')
    .order('created_at', { ascending: false })

  if (!all) query = query.eq('status', 'pending')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // pre_ 계정은 사전프로필이므로 전체 조회 시 포함하되 표시
  return NextResponse.json(data ?? [])
}
