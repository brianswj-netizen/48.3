import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import BottomNav from '@/components/BottomNav'
import Sidebar from '@/components/Sidebar'
import RightPanel from '@/components/RightPanel'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // 미들웨어가 처리하지만 이중 방어
  if (!session?.user?.kakaoId) {
    redirect('/login')
  }

  // 실명 입력 여부 확인 (Supabase에서 직접 조회)
  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('name, nickname, avatar_url, role, status, subgroup')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user?.name) {
    redirect('/setup')
  }

  if (user.role !== 'admin' && user.status !== 'approved') {
    redirect('/pending')
  }

  // admin이면 승인 대기 멤버 수 조회
  let pendingCount = 0
  if (user.role === 'admin') {
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    pendingCount = count ?? 0
  }

  // 미읽은 멘션 수 조회 (홈 탭 배지용)
  const { data: meUser } = await supabase
    .from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  let unreadMentionCount = 0
  if (meUser?.id) {
    const { count } = await supabase
      .from('mention_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('mentioned_user_id', meUser.id)
      .eq('is_read', false)
    unreadMentionCount = count ?? 0
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* 모바일: 단일 컬럼 + 하단 탭바 */}
      {/* PC (md+): 3단 레이아웃 */}
      <div className="flex max-w-[1280px] mx-auto">

        {/* 왼쪽 사이드바 (PC only) */}
        <Sidebar user={user} />

        {/* 가운데 콘텐츠 */}
        <main className="flex-1 min-w-0 md:max-w-[720px] md:border-x md:border-border">
          {/* 모바일: 하단 탭바 높이만큼 패딩 */}
          <div className="pb-16 md:pb-0">{children}</div>
          {/* 푸터 */}
          <footer className="hidden md:block text-center py-6 border-t border-border">
            <p className="text-[11px] text-muted">© 2026-04-10 &nbsp;Made by Brian Sungwook Jung</p>
            <p className="text-[11px] text-muted mt-0.5">Powered by Claude AI (Anthropic)</p>
          </footer>
        </main>

        {/* 오른쪽 패널 (lg only) */}
        <RightPanel />
      </div>

      {/* 하단 탭바 (모바일 only) */}
      <BottomNav pendingCount={pendingCount} isAdmin={user.role === 'admin'} unreadMentionCount={unreadMentionCount} />
    </div>
  )
}
