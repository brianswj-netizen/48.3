import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const { emoji } = await req.json()
  if (!emoji) return NextResponse.json({ error: '이모지 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: existing } = await supabase
    .from('creature_reactions').select('id, emoji').eq('creature_id', id).eq('user_id', user.id).maybeSingle()

  if (existing && existing.emoji === emoji) {
    await supabase.from('creature_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ reacted: false, emoji, previousEmoji: null })
  }
  if (existing) await supabase.from('creature_reactions').delete().eq('id', existing.id)
  await supabase.from('creature_reactions').insert({ creature_id: id, user_id: user.id, emoji })
  return NextResponse.json({ reacted: true, emoji, previousEmoji: existing?.emoji ?? null })
}
