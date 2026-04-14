import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import SapjilClient from '@/components/SapjilClient'

async function getPosts(currentUserId: string) {
  const supabase = createAdminClient()
  const { data: posts } = await supabase
    .from('sapjil_posts')
    .select('id, title, content, created_at, author:users!author_id(id, name, nickname, avatar_url)')
    .order('created_at', { ascending: false })

  if (!posts) return []

  const postIds = posts.map((p: any) => p.id)
  const { data: reactions } = await supabase
    .from('sapjil_reactions')
    .select('post_id, emoji, user_id')
    .in('post_id', postIds.length ? postIds : ['none'])

  const reactionsByPost: Record<string, { emoji: string; count: number; mine: boolean }[]> = {}
  for (const r of (reactions ?? [])) {
    if (!reactionsByPost[r.post_id]) reactionsByPost[r.post_id] = []
    const existing = reactionsByPost[r.post_id].find((x: any) => x.emoji === r.emoji)
    if (existing) {
      existing.count++
      if (r.user_id === currentUserId) existing.mine = true
    } else {
      reactionsByPost[r.post_id].push({ emoji: r.emoji, count: 1, mine: r.user_id === currentUserId })
    }
  }

  return posts.map((p: any) => ({
    ...p,
    reactions: reactionsByPost[p.id] ?? [],
  }))
}

export default async function SapjilPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const posts = await getPosts(user.id)

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#6366F1' }}>
        <h1 className="text-xl font-black text-white">🔧 삽질기</h1>
        <p className="text-white/70 text-sm mt-1">맞닥뜨린 문제와 해결책, 경험을 공유하는 공간</p>
      </header>
      <SapjilClient
        initialPosts={posts}
        currentUserId={user.id}
        isAdmin={user.role === 'admin'}
      />
    </div>
  )
}
