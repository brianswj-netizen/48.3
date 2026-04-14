import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/** @멘션용 멤버 목록 (이름+닉네임만, 5분 캐시) */
export const getMentionMembers = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('users')
      .select('id, name, nickname')
      .eq('status', 'approved')
      .not('name', 'is', null)
      .not('kakao_id', 'like', 'pre_%')
      .order('name')
    return (data ?? []) as { id: string; name: string | null; nickname: string | null }[]
  },
  ['mention-members'],
  { revalidate: 300, tags: ['members'] }
)
