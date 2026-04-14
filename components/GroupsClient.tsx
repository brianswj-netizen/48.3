'use client'
import { useState } from 'react'
import Image from 'next/image'

type Member = {
  id: string
  name: string | null
  nickname: string | null
  avatar_url: string | null
  subgroup: string | null
  level: string | null
}

const LEVEL_GROUPS = [
  { emoji: '🌱', name: '입문반', desc: 'AI 처음이에요',        color: '#1D9E75', subgroup: '입문반' },
  { emoji: '⚡', name: '실전반', desc: '실무에 바로 써볼게요', color: '#534AB7', subgroup: '실전반' },
]

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) return <Image src={avatarUrl} alt={name} width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" />
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: 'var(--purple)' }}>
      {name.charAt(0)}
    </div>
  )
}

export default function GroupsClient({ members }: { members: Member[] }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  function getMembersForGroup(subgroup: string) {
    return members.filter(m => m.subgroup === subgroup)
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#534AB7' }}>
        <h1 className="text-xl font-black text-white">소모임</h1>
      </header>

      <div className="px-4 py-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted">AI 이해도별</p>

        {LEVEL_GROUPS.map(g => {
          const groupMembers = getMembersForGroup(g.subgroup)
          const isOpen = openGroup === g.subgroup
          return (
            <div key={g.name} className="bg-white rounded-[14px] overflow-hidden"
              style={{ border: '0.5px solid var(--border)' }}>
              {/* 그룹 헤더 */}
              <div
                className="px-4 py-4 flex items-center gap-3 cursor-pointer active:bg-gray-50"
                onClick={() => setOpenGroup(isOpen ? null : g.subgroup)}
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${g.color}18` }}>
                  {g.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{g.name}</p>
                  <p className="text-xs text-muted">{g.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                    {groupMembers.length}명
                  </span>
                  <span className="text-muted text-sm transition-transform duration-200"
                    style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ⌄
                  </span>
                </div>
              </div>
              {/* 멤버 목록 */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 flex flex-col gap-2">
                  {groupMembers.length === 0 ? (
                    <p className="text-xs text-muted text-center py-2">아직 멤버가 없습니다.</p>
                  ) : groupMembers.map(m => {
                    const name = m.name ?? m.nickname ?? '알 수 없음'
                    return (
                      <div key={m.id} className="flex items-center gap-2.5">
                        <Avatar name={name} avatarUrl={m.avatar_url} />
                        <span className="text-sm font-medium text-gray-800">{name}</span>
                        {m.level && (
                          <span className="text-[10px] text-muted ml-auto">{m.level}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* 관심 종류별 - 정적 표시 유지 */}
        <p className="text-xs font-semibold text-muted mt-2">관심 종류별 <span className="font-normal text-muted/60">(기능 추후 개발)</span></p>
        <p className="text-[11px] text-muted/70 -mt-2">유사한 관심을 가진 분들끼리 만들어 사용하세요.</p>
        {[
          { emoji: '🏗️', name: '시행·개발 AI' },
          { emoji: '💹', name: '금융·투자 AI' },
          { emoji: '⚖️', name: '감정평가·법률 AI' },
        ].map(g => (
          <div key={g.name} className="bg-white rounded-[14px] px-4 py-4 flex items-center gap-3"
            style={{ border: '0.5px solid var(--border)' }}>
            <span className="text-2xl w-9 text-center">{g.emoji}</span>
            <p className="text-sm font-bold text-gray-900 flex-1">{g.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
