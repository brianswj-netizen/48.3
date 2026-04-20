import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import { notFound } from 'next/navigation'
import MakerDetailClient from '@/components/MakerDetailClient'

export default async function MakerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const supabase = createAdminClient()

  // creature + feedbacks 먼저 가져오기
  const [{ data: creature }, { data: feedbacks }] = await Promise.all([
    supabase
      .from('creatures')
      .select('id, title, description, content, url, image_url, status, version, created_at, author:users!author_id(id, name, nickname, avatar_url)')
      .eq('id', id)
      .single(),
    supabase
      .from('creature_feedbacks')
      .select('id, feedback_type, content, created_at, author:users!author_id(id, name, nickname)')
      .eq('creature_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!creature) notFound()

  // 작성자의 삽질기 글 + 반응 가져오기
  const authorRaw = creature.author as any
  const authorId = Array.isArray(authorRaw) ? authorRaw[0]?.id : authorRaw?.id
  const { data: rawPosts } = authorId
    ? await supabase
        .from('sapjil_posts')
        .select('id, title, content, image_url, created_at')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
    : { data: [] }

  const postIds = (rawPosts ?? []).map((p: any) => p.id)
  const { data: reactionsData } = postIds.length > 0
    ? await supabase.from('sapjil_reactions').select('post_id, emoji, user_id').in('post_id', postIds)
    : { data: [] }

  const reactionsByPost: Record<string, { emoji: string; count: number; userIds: string[] }[]> = {}
  for (const r of (reactionsData ?? [])) {
    if (!reactionsByPost[r.post_id]) reactionsByPost[r.post_id] = []
    const ex = reactionsByPost[r.post_id].find(x => x.emoji === r.emoji)
    if (ex) { ex.count++; ex.userIds.push(r.user_id) }
    else reactionsByPost[r.post_id].push({ emoji: r.emoji, count: 1, userIds: [r.user_id] })
  }

  const sapjilPosts = (rawPosts ?? []).map((p: any) => ({ ...p, reactions: reactionsByPost[p.id] ?? [] }))

  return (
    <MakerDetailClient
      creature={creature as any}
      feedbacks={(feedbacks ?? []) as any}
      sapjilPosts={(sapjilPosts ?? []) as any}
      currentUserId={user?.id ?? ''}
      isAdmin={user?.role === 'admin'}
    />
  )
}
