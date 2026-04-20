import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data: creatures } = await supabase
    .from('creatures')
    .select('id, title, description, url, image_url, created_at, author:users!author_id(id, name, nickname, avatar_url)')
    .order('created_at', { ascending: false })

  if (!creatures) return NextResponse.json([])

  const ids = creatures.map((c: any) => c.id)
  const { data: reactions } = await supabase
    .from('creature_reactions')
    .select('creature_id, emoji, user_id')
    .in('creature_id', ids.length ? ids : ['none'])

  const reactionsByCreature: Record<string, { emoji: string; count: number; userIds: string[] }[]> = {}
  for (const r of (reactions ?? [])) {
    if (!reactionsByCreature[r.creature_id]) reactionsByCreature[r.creature_id] = []
    const existing = reactionsByCreature[r.creature_id].find(x => x.emoji === r.emoji)
    if (existing) { existing.count++; existing.userIds.push(r.user_id) }
    else reactionsByCreature[r.creature_id].push({ emoji: r.emoji, count: 1, userIds: [r.user_id] })
  }

  const { data: comments } = await supabase
    .from('creature_comments')
    .select('creature_id')
    .in('creature_id', ids.length ? ids : ['none'])

  const commentCounts: Record<string, number> = {}
  for (const c of (comments ?? [])) {
    commentCounts[c.creature_id] = (commentCounts[c.creature_id] ?? 0) + 1
  }

  return NextResponse.json(creatures.map((c: any) => ({
    ...c,
    reactions: reactionsByCreature[c.id] ?? [],
    comment_count: commentCounts[c.id] ?? 0,
  })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { title, description, url, image_url } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id, name, nickname, avatar_url').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: creature, error } = await supabase
    .from('creatures')
    .insert({ title: title.trim(), description: description?.trim() || null, url: url?.trim() || null, image_url: image_url ?? null, author_id: user.id })
    .select('id, title, description, url, image_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('home', {})
  return NextResponse.json({ ...creature, author: user, reactions: [], comment_count: 0 })
}
