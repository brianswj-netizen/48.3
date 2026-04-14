import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

// POST: 해결됨 토글 (작성자 또는 admin)
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId)
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: suggestion } = await supabase
    .from('suggestions').select('author_id, status').eq('id', id).single()
  if (!suggestion) return NextResponse.json({ error: '제안 없음' }, { status: 404 })

  if (suggestion.author_id !== user.id && user.role !== 'admin')
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  // 토글: resolved ↔ open
  const newStatus = suggestion.status === 'resolved' ? 'open' : 'resolved'
  const { error } = await supabase
    .from('suggestions').update({ status: newStatus }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('suggestions', {})
  return NextResponse.json({ status: newStatus })
}
