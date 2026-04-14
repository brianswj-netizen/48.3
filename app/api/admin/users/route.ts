import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
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

  const { data, error } = await supabase
    .from('users')
    .select('id, name, nickname, avatar_url, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
