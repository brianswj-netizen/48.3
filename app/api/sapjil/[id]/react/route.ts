import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

// POST: toggle reaction (exclusive - one per user)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const { emoji } = await req.json()
  if (!emoji) return NextResponse.json({ error: 'emoji 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  // No self-react check
  const { data: post } = await supabase
    .from('sapjil_posts').select('author_id').eq('id', id).single()
  if (post?.author_id === user.id) {
    return NextResponse.json({ error: '본인 글에는 반응할 수 없습니다' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('sapjil_reactions')
    .select('id, emoji')
    .eq('post_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.emoji === emoji) {
    await supabase.from('sapjil_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ reacted: false, emoji })
  }
  if (existing) {
    await supabase.from('sapjil_reactions').delete().eq('id', existing.id)
  }
  await supabase.from('sapjil_reactions').insert({ post_id: id, user_id: user.id, emoji })
  return NextResponse.json({ reacted: true, emoji, previousEmoji: existing?.emoji ?? null })
}
