import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return null
  const supabase = createAdminClient()
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('kakao_id', session.user.kakaoId)
    .single()
  return me?.role === 'admin' ? supabase : null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json() // 'approved' | 'pending'

  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 멤버 승인/퇴장 시 멤버 관련 캐시 즉시 무효화
  revalidateTag('members', {})

  return NextResponse.json({ ok: true })
}
