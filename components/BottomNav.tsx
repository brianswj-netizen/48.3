'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    label: '홈',
    activeColor: '#2880A0',
    icon: (active: boolean, color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
          fill={active ? color : 'none'}
          stroke={active ? color : 'var(--muted)'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: '라운지',
    activeColor: '#E4C0B0',
    icon: (active: boolean, color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
          fill={active ? color : 'none'}
          stroke={active ? color : 'var(--muted)'}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: '일정',
    activeColor: '#A8BCCE',
    icon: (active: boolean, color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="4" width="18" height="18" rx="2"
          fill={active ? color : 'none'}
          stroke={active ? color : 'var(--muted)'}
          strokeWidth="1.8"
        />
        <path d="M8 2V6M16 2V6M3 10H21" stroke={active ? 'white' : 'var(--muted)'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/more',
    label: '더보기',
    activeColor: '#8C6AAE',
    icon: (active: boolean, color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="1.5" fill={active ? color : 'var(--muted)'} />
        <circle cx="12" cy="12" r="1.5" fill={active ? color : 'var(--muted)'} />
        <circle cx="19" cy="12" r="1.5" fill={active ? color : 'var(--muted)'} />
      </svg>
    ),
  },
]

export default function BottomNav({
  pendingCount = 0,
  isAdmin = false,
  unreadMentionCount = 0,
}: {
  pendingCount?: number
  isAdmin?: boolean
  unreadMentionCount?: number
}) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          const color = tab.activeColor

          // 홈 탭: 미읽 멘션 배지
          const showHomeBadge = tab.href === '/' && unreadMentionCount > 0
          // 더보기 탭: 멤버 승인 대기 배지 (admin만)
          const showMoreBadge = tab.href === '/more' && isAdmin && pendingCount > 0

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              className="flex flex-col items-center justify-center w-full h-full gap-0.5"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              aria-label={tab.label}
            >
              <div className="relative">
                {tab.icon(active, color)}
                {showHomeBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ background: '#F59E0B' }}>
                    {unreadMentionCount > 9 ? '9+' : unreadMentionCount}
                  </span>
                )}
                {showMoreBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ background: '#EF4444' }}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? color : 'var(--muted)' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
