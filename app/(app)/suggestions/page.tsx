import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import { getMentionMembers } from '@/lib/members'
import SuggestionsClient from '@/components/SuggestionsClient'

// 제안 목록 + 전체 좋아요를 캐시 (60초) — liked_by_me는 클라이언트 측에서 userId로 계산
const getSuggestionsRaw = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const [suggestionsRes, likesRes] = await Promise.all([
      supabase
        .from('suggestions')
        .select('id, title, description, category, status, created_at, author_id, author:users!author_id(name, nickname)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('suggestion_likes')
        .select('suggestion_id, user_id'),
    ])
    return {
      suggestions: suggestionsRes.data ?? [],
      likes: likesRes.data ?? [],
    }
  },
  ['suggestions-raw'],
  { revalidate: 60, tags: ['suggestions'] }
)

export default async function SuggestionsPage() {
  const [user, { suggestions, likes }, members] = await Promise.all([
    getCurrentUser(),
    getSuggestionsRaw(),
    getMentionMembers(),
  ])

  const enriched = suggestions.map((s: any) => {
    const sLikes = likes.filter((l: any) => l.suggestion_id === s.id)
    return {
      ...s,
      like_count: sLikes.length,
      liked_by_me: user?.id ? sLikes.some((l: any) => l.user_id === user.id) : false,
    }
  })

  return (
    <SuggestionsClient
      suggestions={enriched}
      currentUserId={user?.id ?? null}
      currentUserName={user?.name ?? user?.nickname ?? null}
      isAdmin={user?.role === 'admin'}
      members={members}
    />
  )
}
