'use client'

import { useState } from 'react'

type RoomMember = {
  id: string
  name: string | null
  nickname: string | null
  avatar_url: string | null
  subgroup: string | null
  role: string
}

export default function MemberListButton({ members, roomName }: { members: RoomMember[]; roomName: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 헤더 아이콘 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="4" stroke="#6B7280" strokeWidth="1.8" />
          <path d="M2 21C2 17.134 5.134 14 9 14H11" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="18" cy="16" r="4" stroke="#6B7280" strokeWidth="1.8" />
          <path d="M15 16H21M18 13V19" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-semibold text-gray-500">{members.length}</span>
      </button>

      {/* 오버레이 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 배경 딤 */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* 멤버 패널 (오른쪽에서 슬라이드) */}
          <div
            className="relative w-72 h-full bg-white shadow-2xl flex flex-col"
            style={{ maxWidth: '80vw' }}
          >
            {/* 패널 헤더 */}
            <div className="px-5 pt-12 pb-4 border-b border-border md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-base">{roomName} 멤버</h2>
                  <p className="text-xs text-muted mt-0.5">{members.length}명</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 멤버 목록 */}
            <div className="flex-1 overflow-y-auto py-2">
              {members.map((member) => {
                const displayName = member.name ?? member.nickname ?? '?'
                const initial = displayName.charAt(0)
                const isAdmin = member.role === 'admin'

                return (
                  <div key={member.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50">
                    {/* 아바타 */}
                    {member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatar_url}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold ${member.avatar_url ? 'hidden' : ''}`}
                      style={{ background: 'var(--purple)' }}
                    >
                      {initial}
                    </div>

                    {/* 이름 + 역할 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">{displayName}</span>
                        {isAdmin && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                            style={{ background: 'var(--purple)' }}>
                            운영자
                          </span>
                        )}
                      </div>
                      {member.subgroup && (
                        <p className="text-xs text-muted truncate">{member.subgroup}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
