import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: list all posts with author info and reactions
export async function GET() {
  const supabase = createAdminClient()
  const { data: posts } = await supabase
    .from('sapjil_posts')
    .select('id, title, content, image_url, created_at, author:users!author_id(id, name, nickname, avatar_url)')
    .order('created_at', { ascending: false })

  if (!posts) return NextResponse.json([])

  // Get all reactions for these posts
  const postIds = posts.map((p: any) => p.id)
  const { data: reactions } = await supabase
    .from('sapjil_reactions')
    .select('post_id, emoji, user_id')
    .in('post_id', postIds)

  const reactionsByPost: Record<string, { emoji: string; count: number; userIds: string[] }[]> = {}
  for (const r of (reactions ?? [])) {
    if (!reactionsByPost[r.post_id]) reactionsByPost[r.post_id] = []
    const existing = reactionsByPost[r.post_id].find(x => x.emoji === r.emoji)
    if (existing) {
      existing.count++
      existing.userIds.push(r.user_id)
    } else {
      reactionsByPost[r.post_id].push({ emoji: r.emoji, count: 1, userIds: [r.user_id] })
    }
  }

  const result = posts.map((p: any) => ({
    ...p,
    reactions: reactionsByPost[p.id] ?? [],
  }))

  return NextResponse.json(result)
}

// POST: create post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { title, content, image_url } = await req.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id, name, nickname, avatar_url').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: post, error } = await supabase
    .from('sapjil_posts')
    .insert({ title: title.trim(), content: content.trim(), author_id: user.id, image_url: image_url ?? null })
    .select('id, title, content, image_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...post, author: user, reactions: [] })
}
