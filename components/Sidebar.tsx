'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type SidebarUser = {
  name: string | null
  nickname: string | null
  avatar_url: string | null
  role: string
  subgroup: string | null
}

const navItems = [
  {
    href: '/',
    label: '홈',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: '채팅',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/docs',
    label: '자료실',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 7C3 5.89543 3.89543 5 5 5H11L13 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: '일정',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 2V6M16 2V6M3 10H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  { type: 'divider' as const },
  {
    href: '/members',
    label: '멤버 소개',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 21C2 17.134 5.13401 14 9 14C12.866 14 16 17.134 16 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19 8V14M16 11H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/groups',
    label: '소모임',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 21C2 17.134 5.134 14 9 14H11C14.866 14 18 17.134 18 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/suggestions',
    label: '제안 게시판',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/votes',
    label: '투표',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 12L10 15L17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/evaluator',
    label: 'AI 평가관',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 10L9 8L11 10L13 7L15 10L17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: '설정',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2V4M12 20V22M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M2 12H4M20 12H22M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  const displayName = user.name ?? user.nickname ?? '?'
  const initial = displayName.charAt(0)
  const roleLabel = user.role === 'admin' ? '운영자' : (user.subgroup ?? '멤버')

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 overflow-y-auto"
      style={{ background: 'var(--navy)' }}
    >
      {/* 로고 */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-lg font-black tracking-tight leading-tight">
            AI Survival<br />Crew
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full self-start mt-1"
            style={{ background: 'var(--purple)', color: 'white' }}
          >
            S1
          </span>
        </div>
        <p className="text-white/40 text-[11px] mt-1">건국대 부동산대학원</p>
      </div>

      {/* 구분선 */}
      <div className="mx-5 border-t border-white/10 mb-3" />

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map((item, i) => {
          if (item.type === 'divider') {
            return <div key={i} className="my-2 mx-2 border-t border-white/10" />
          }
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <span className={active ? 'text-white' : 'text-white/60'}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* 하단 프로필 + 로그아웃 */}
      <div className="mx-3 mb-4 mt-3">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: 'var(--purple)' }}
              >
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-[11px] text-white/50 truncate">{roleLabel}</p>
            </div>
            {/* 설정 아이콘 */}
            <Link href="/settings" className="text-white/40 hover:text-white/70 transition-colors shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 2V4M12 20V22M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M2 12H4M20 12H22M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>

        {/* 로그아웃 버튼 */}
        <a
          href="/api/auth/signout"
          className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/8 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M9 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          로그아웃
        </a>
      </div>
    </aside>
  )
}
