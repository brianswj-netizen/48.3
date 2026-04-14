import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ commentId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId)
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { commentId } = await params
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: comment } = await supabase
    .from('suggestion_comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!comment) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  if (user.role !== 'admin' && comment.author_id !== user.id)
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { error } = await supabase.from('suggestion_comments').delete().eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
