import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import GroupsClient from '@/components/GroupsClient'

const getGroupMembers = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('users')
      .select('id, name, nickname, avatar_url, subgroup, level')
      .not('name', 'is', null)
      .not('kakao_id', 'like', 'pre_%')
      .neq('name', '방수진')
      .neq('name', '문지연')
      .neq('name', '최유미')
      .eq('status', 'approved')
      .order('name')
    return data ?? []
  },
  ['groups-members'],
  { revalidate: 300, tags: ['members'] }   // members 태그 공유 → 멤버 변경 시 함께 무효화
)

export default async function GroupsPage() {
  const members = await getGroupMembers()
  return <GroupsClient members={members} />
}
