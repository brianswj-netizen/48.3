import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import MakersGridClient from '@/components/MakersGridClient'

export default async function MakersPage() {
  const user = await getCurrentUser()
  const supabase = createAdminClient()

  const { data: creatures } = await supabase
    .from('creatures')
    .select('id, title, description, content, url, image_url, status, version, created_at, author:users!author_id(id, name, nickname, avatar_url)')
    .order('created_at', { ascending: true }) // 먼저 만든 순서

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#BE185D' }}>
        <h1 className="text-white font-black text-xl">🛸 제작소</h1>
        <p className="text-white/70 text-sm mt-0.5">크루가 만든 앱·도구·작품</p>
      </header>

      <MakersGridClient
        creatures={(creatures ?? []) as any}
        currentUserId={user?.id ?? ''}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  )
}
