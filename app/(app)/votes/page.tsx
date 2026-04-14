import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import VotesClient from '@/components/VotesClient'

// 투표 원본 + 전체 응답 캐시 (30초) — my_option_id는 user.id로 계산
const getVotesRaw = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('votes')
      .select(`
        id, title, description, deadline,
        vote_options(id, text, votes),
        vote_responses(user_id, option_id)
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    return data ?? []
  },
  ['votes-raw'],
  { revalidate: 30, tags: ['votes'] }
)

export default async function VotesPage() {
  const [user, rawVotes] = await Promise.all([
    getCurrentUser(),
    getVotesRaw(),
  ])

  const votes = rawVotes.map((v: any) => {
    const responses = Array.isArray(v.vote_responses) ? v.vote_responses : []
    const myResponse = user?.id ? responses.find((r: any) => r.user_id === user.id) : null
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      deadline: v.deadline,
      vote_options: Array.isArray(v.vote_options) ? v.vote_options : [],
      my_option_id: myResponse?.option_id ?? null,
      participant_count: new Set(responses.map((r: any) => r.user_id)).size,
    }
  })

  return <VotesClient votes={votes} isAdmin={user?.role === 'admin'} />
}
