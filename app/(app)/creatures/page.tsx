import { getCurrentUser } from '@/lib/user'
import { createAdminClient } from '@/lib/supabase/admin'
import CreaturesClient from '@/components/CreaturesClient'

async function getPosts(currentUserId: string) {
  const supabase = createAdminClient()
  const { data: creatures } = await supabase
    .from('creatures')
    .select('id, title, description, url, image_url, created_at, author:users!author_id(id, name, nickname, avatar_url)')
    .order('created_at', { ascending: false })

  if (!creatures) return []

  const ids = creatures.map((c: any) => c.id)
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('creature_reactions').select('creature_id, emoji, user_id').in('creature_id', ids.length ? ids : ['none']),
    supabase.from('creature_comments').select('creature_id').in('creature_id', ids.length ? ids : ['none']),
  ])

  const reactionsByCreature: Record<string, { emoji: string; count: number; mine: boolean }[]> = {}
  for (const r of (reactions ?? [])) {
    if (!reactionsByCreature[r.creature_id]) reactionsByCreature[r.creature_id] = []
    const ex = reactionsByCreature[r.creature_id].find(x => x.emoji === r.emoji)
    if (ex) { ex.count++; if (r.user_id === currentUserId) ex.mine = true }
    else reactionsByCreature[r.creature_id].push({ emoji: r.emoji, count: 1, mine: r.user_id === currentUserId })
  }

  const commentCounts: Record<string, number> = {}
  for (const c of (comments ?? [])) commentCounts[c.creature_id] = (commentCounts[c.creature_id] ?? 0) + 1

  return creatures.map((c: any) => ({
    ...c,
    reactions: reactionsByCreature[c.id] ?? [],
    comment_count: commentCounts[c.id] ?? 0,
  }))
}

export default async function CreaturesPage() {
  const user = await getCurrentUser()
  if (!user) return null
  const posts = await getPosts(user.id)
  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#BE185D' }}>
        <h1 className="text-xl font-black text-white">🛸 나의 피조물</h1>
        <p className="text-white/70 text-sm mt-1">내가 만든 앱·도구·작품을 소개하고 피드백 받는 공간</p>
      </header>
      <CreaturesClient
        initialPosts={posts}
        currentUserId={user.id}
        isAdmin={user.role === 'admin'}
      />
    </div>
  )
}
