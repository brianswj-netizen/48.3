import { getServerSession } from 'next-auth'
import { unstable_cache } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserProfile = {
  id: string
  kakao_id: string
  name: string | null
  nickname: string | null
  avatar_url: string | null
  role: 'admin' | 'member'
  status: 'pending' | 'approved'
  level: number
  score: number
  bio: string | null
  subgroup: string | null
  subgroup_changed_at: string | null
  major: string | null
  generation: number | null
  birth_year: number | null
  phone: string | null
  company: string | null
  position: string | null
}

// 유저 프로필을 kakaoId 기준으로 60초 캐싱
// → 모든 페이지에서 호출되는 DB 쿼리 제거 (JWT 검증은 별도로 빠름)
function getCachedUser(kakaoId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('kakao_id', kakaoId)
        .single()
      return data as UserProfile | null
    },
    [`user-profile-${kakaoId}`],
    { revalidate: 60, tags: [`user-${kakaoId}`] }
  )()
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return null
  return getCachedUser(session.user.kakaoId)
}
