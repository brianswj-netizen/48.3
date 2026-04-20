import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import MembersClient from '@/components/MembersClient'

const getMembers = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('users')
      .select('id, name, nickname, avatar_url, role, major, generation, birth_year, phone, company, position, bio, level')
      .not('name', 'is', null)
      .not('kakao_id', 'like', 'pre_%')
      .not('kakao_id', 'like', 'system_%')
      .eq('status', 'approved')
      .order('name', { ascending: true })
    return data ?? []
  },
  ['members-list'],
  { revalidate: 300, tags: ['members'] }   // 5분 캐시 / 멤버 변경 시 revalidateTag('members')
)

export default async function MembersPage() {
  const [members, user] = await Promise.all([getMembers(), getCurrentUser()])
  return <MembersClient members={members} isAdmin={user?.role === 'admin'} currentUserId={user?.id ?? null} />
}
