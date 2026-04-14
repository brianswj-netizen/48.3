import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ commentId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { commentId } = await params
  const supabase = createAdminClient()

  const { data: user } = await supabase.from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: comment } = await supabase.from('announcement_comments').select('author_id').eq('id', commentId).single()
  if (!comment) return NextResponse.json({ error: '없음' }, { status: 404 })

  if (user.role !== 'admin' && comment.author_id !== user.id)
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  await supabase.from('announcement_comments').delete().eq('id', commentId)
  return NextResponse.json({ ok: true })
}
