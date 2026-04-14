import Link from 'next/link'
import { getCurrentUser } from '@/lib/user'
import { createAdminClient } from '@/lib/supabase/admin'
import DesignInspirationSection from '@/components/DesignInspirationSection'
import LabSection from '@/components/LabSection'

const baseMenus = [
  { href: '/settings',    emoji: '⚙️',  label: '설정',       desc: '프로필·알림·글자크기 설정',      iconBg: '#0EA5E9', iconLight: '#F0F9FF' },
  { href: '/members',     emoji: '👥',  label: '멤버 소개',  desc: '16명의 크루를 확인하세요',        iconBg: '#F59E0B', iconLight: '#FFFBEB' },
  { href: '/groups',      emoji: '🫂',  label: '소모임',     desc: '입문반·실전반 소모임',            iconBg: '#7C3AED', iconLight: '#F5F3FF' },
  { href: '/suggestions', emoji: '💡',  label: '제안',       desc: '앱·모임 개선 아이디어 공유',      iconBg: '#F43F5E', iconLight: '#FFF1F2' },
  { href: '/votes',       emoji: '🗳️',  label: '투표',       desc: '진행 중인 투표에 참여하세요',     iconBg: '#DC2626', iconLight: '#FEF2F2' },
]

const adminMenus = [
  { href: '/admin', emoji: '🔑', label: '멤버 승인', desc: '가입 대기 중인 멤버를 승인하세요', iconBg: '#4F46E5', iconLight: '#EEF2FF' },
]

export default async function MorePage() {
  const user = await getCurrentUser()

  let pendingCount = 0
  if (user?.role === 'admin') {
    const supabase = createAdminClient()
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    pendingCount = count ?? 0
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#8C6AAE' }}>
        <h1 className="text-xl font-bold text-white">더보기</h1>
      </header>

      <div className="px-4 py-4 flex flex-col gap-2 pb-24">

        {/* Admin 권한 섹션 (관리자 전용) */}
        {isAdmin && (
          <div className="flex flex-col gap-2 mb-2">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider px-1">Admin 권한</p>
            {adminMenus.map((menu) => (
              <Link key={menu.href} href={menu.href}>
                <div
                  className="bg-white rounded-[14px] px-4 py-3.5 flex items-center gap-4 active:bg-gray-50"
                  style={{ border: '0.5px solid var(--border)' }}
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xl"
                    style={{ background: menu.iconLight }}>
                    {menu.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{menu.label}</p>
                      {pendingCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: menu.iconBg }}>
                          {pendingCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{menu.desc}</p>
                  </div>
                  <span className="text-muted text-lg">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 일반 메뉴 */}
        <p className="text-[11px] font-bold text-muted uppercase tracking-wider px-1">메뉴</p>
        {baseMenus.map((menu) => (
          <Link key={menu.href} href={menu.href}>
            <div
              className="bg-white rounded-[14px] px-4 py-3.5 flex items-center gap-4 active:bg-gray-50"
              style={{ border: '0.5px solid var(--border)' }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xl"
                style={{ background: menu.iconLight }}>
                {menu.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{menu.label}</p>
                <p className="text-xs text-muted mt-0.5">{menu.desc}</p>
              </div>
              <span className="text-muted text-lg">›</span>
            </div>
          </Link>
        ))}

        {/* 실험실 (접이식) */}
        <LabSection />

        <DesignInspirationSection />

        {/* 저작권 푸터 */}
        <div className="mt-2 pb-4 text-center flex flex-col gap-0.5">
          <p className="text-[11px] text-muted">© 2026-04-10 &nbsp; Made by Brian Sungwook Jung</p>
          <p className="text-[11px] text-muted">Powered by Claude AI (Anthropic)</p>
        </div>
      </div>
    </div>
  )
}
