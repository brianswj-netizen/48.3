import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import { getMentionMembers } from '@/lib/members'
import AnnouncementsClient from '@/components/AnnouncementsClient'

// 공지사항 원본 + 전체 리액션 캐시 (60초)
const getAnnouncementsRaw = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('announcements')
      .select('*, author:users!created_by(name, nickname), announcement_reactions(user_id, emoji)')
      .order('created_at', { ascending: false })
      .limit(30)
    return data ?? []
  },
  ['announcements-raw'],
  { revalidate: 60, tags: ['announcements'] }
)

export default async function AnnouncementsPage() {
  // getCurrentUser + DB 병렬 실행
  const [user, rawData, members] = await Promise.all([
    getCurrentUser(),
    getAnnouncementsRaw(),
    getMentionMembers(),
  ])

  if (!user) return null

  const items = rawData.map((item: any) => {
    const author = Array.isArray(item.author) ? item.author[0] : item.author
    const reactions = Array.isArray(item.announcement_reactions) ? item.announcement_reactions : []

    const reactionMap: Record<string, { count: number; reacted: boolean }> = {}
    for (const r of reactions) {
      if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, reacted: false }
      reactionMap[r.emoji].count++
      if (user.id && r.user_id === user.id) reactionMap[r.emoji].reacted = true
    }

    return {
      id: item.id,
      title: item.title,
      content: item.content,
      created_at: item.created_at,
      author_id: item.created_by ?? null,
      authorName: author?.name ?? author?.nickname ?? '',
      reactions: reactionMap,
    }
  })

  return <AnnouncementsClient initialItems={items} isAdmin={user.role === 'admin'} currentUserId={user.id ?? null} currentUserName={user.name ?? user.nickname ?? null} members={members} />
}
