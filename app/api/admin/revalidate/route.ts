import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const supabase = createAdminClient()
  const { data } = await supabase.from('users').select('role').eq('kakao_id', session.user.kakaoId).single()
  if (data?.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  revalidateTag('events', {})
  revalidateTag('suggestions', {})
  revalidateTag('announcements', {})
  revalidateTag('votes', {})
  revalidateTag('home', {})
  revalidateTag('members', {})

  return NextResponse.json({ ok: true, message: '모든 캐시가 갱신되었습니다.' })
}
