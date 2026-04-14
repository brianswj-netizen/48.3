'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Member = {
  id: string
  name: string | null
  nickname: string | null
  avatar_url: string | null
  role: string
  major: string | null
  generation: number | null
  birth_year: number | null
  phone: string | null
  company: string | null
  position: string | null
  bio: string | null
  level: number
  isAdmin?: boolean
}

const MAJOR_LABELS: Record<string, string> = {
  글프: '글로벌 프롭테크',
  건개: '부동산 건설개발',
  경관: '부동산 경영관리',
  금투: '부동산 금융투자',
}

const FILTERS = ['전체', '글프', '건개', '경관', '금투'] as const

const AVATAR_COLORS = [
  '#534AB7', '#1D9E75', '#D85A30', '#BA7517',
  '#6366F1', '#0EA5E9', '#EC4899', '#8B5CF6',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function AvatarImg({ name, url, size = 44 }: { name: string; url: string | null; size?: number }) {
  const [err, setErr] = useState(false)
  if (url && !err) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        onError={() => setErr(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, background: getAvatarColor(name), fontSize: size * 0.4 }}
    >
      {name.charAt(0)}
    </div>
  )
}

function NoteSection({ memberId, isSelf }: { memberId: string; isSelf: boolean }) {
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/members/${memberId}/notes`)
        const data = await res.json()
        setContent(data.content ?? '')
        setSavedContent(data.content ?? '')
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [memberId])

  async function handleSave() {
    if (content === savedContent) return
    setSaving(true)
    try {
      const res = await fetch(`/api/members/${memberId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        setSavedContent(content)
        setSaved(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setSaved(false), 2000)
      }
    } finally { setSaving(false) }
  }

  if (isSelf) return null

  return (
    <div className="px-5 py-3 border-t border-border/60">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-muted">📝 나만 보는 메모</p>
        {saved && <span className="text-[10px] text-green-500 font-medium">저장됨 ✓</span>}
      </div>
      {loading ? (
        <p className="text-xs text-muted">불러오는 중...</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`${''} 언제 만났는지, 나눈 얘기 등 자유롭게 메모하세요`}
            rows={3}
            className="w-full text-xs text-gray-700 border border-border/60 rounded-xl px-3 py-2 outline-none focus:border-purple-300 resize-none leading-relaxed"
            style={{ background: '#FAFAFA' }}
          />
          <button
            onClick={handleSave}
            disabled={saving || content === savedContent}
            className="mt-1.5 w-full py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--purple)' }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </>
      )}
    </div>
  )
}

function ProfileModal({ member, onClose, isAdmin, currentUserId }: { member: Member; onClose: () => void; isAdmin?: boolean; currentUserId?: string | null }) {
  const [removing, setRemoving] = useState(false)
  const displayName = member.name ?? member.nickname ?? '?'
  const majorLabel = member.major ?? null
  const isSelf = !!currentUserId && currentUserId === member.id

  async function handleRemove() {
    if (!confirm(`정말 ${displayName}님을 퇴장시킬까요?`)) return
    setRemoving(true)
    try {
      await fetch(`/api/admin/users/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'removed' }),
      })
      onClose()
      window.location.reload()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="relative px-5 pt-6 pb-4 text-center border-b border-border">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted text-2xl leading-none"
          >×</button>
          <div className="flex justify-center mb-3">
            <AvatarImg name={displayName} url={member.avatar_url} size={72} />
          </div>
          <p className="text-lg font-black text-gray-900">{displayName}</p>
          {member.company && (
            <p className="text-sm text-muted mt-0.5">{member.company}</p>
          )}
          {member.role === 'admin' && (
            <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: 'var(--navy)' }}>
              운영자
            </span>
          )}
        </div>

        {/* 상세 정보 */}
        <div className="divide-y divide-border/60 max-h-[65vh] overflow-y-auto">
          {(majorLabel || member.generation) && (
            <div className="flex px-5 py-3">
              <span className="text-xs text-muted w-20 shrink-0 pt-0.5">전공·기수</span>
              <span className="text-sm text-gray-800">
                {[majorLabel, member.generation ? `${member.generation}기` : null].filter(Boolean).join(' ')}
              </span>
            </div>
          )}
          {member.birth_year && (
            <div className="flex px-5 py-3">
              <span className="text-xs text-muted w-20 shrink-0 pt-0.5">출생연도</span>
              <span className="text-sm text-gray-800">{member.birth_year}년생</span>
            </div>
          )}
          {member.position && (
            <div className="flex px-5 py-3">
              <span className="text-xs text-muted w-20 shrink-0 pt-0.5">직급</span>
              <span className="text-sm text-gray-800">{member.position}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex px-5 py-3">
              <span className="text-xs text-muted w-20 shrink-0 pt-0.5">연락처</span>
              <a href={`tel:${member.phone}`} className="text-sm" style={{ color: 'var(--purple)' }}>
                {member.phone}
              </a>
            </div>
          )}
          {member.bio && (
            <div className="flex px-5 py-3">
              <span className="text-xs text-muted w-20 shrink-0 pt-0.5">소개</span>
              <span className="text-sm text-gray-800 leading-relaxed">{member.bio}</span>
            </div>
          )}
          {currentUserId && (
            <NoteSection memberId={member.id} isSelf={isSelf} />
          )}
        </div>

        <div className="px-5 py-4 flex flex-col gap-2">
          {isAdmin && member.role !== 'admin' && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#DC2626' }}
            >
              {removing ? '처리 중...' : '퇴장'}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--purple)' }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MembersClient({ members, isAdmin = false, currentUserId }: { members: Member[]; isAdmin?: boolean; currentUserId?: string | null }) {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('전체')
  const [selected, setSelected] = useState<Member | null>(null)

  const filtered = members.filter(m => {
    if (filter === '전체') return true
    return m.major === filter
  })

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-0 md:pt-6" style={{ background: '#C89030' }}>
        <h1 className="text-xl font-black text-white pb-3">멤버 소개</h1>
        <div className="flex overflow-x-auto gap-0 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
              style={filter === f
                ? { borderColor: 'white', color: 'white', fontWeight: 700 }
                : { borderColor: 'transparent', color: 'rgba(255,255,255,0.7)' }}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-12">해당 전공 멤버가 없습니다.</p>
        )}
        {filtered.map(member => {
          const displayName = member.name ?? member.nickname ?? '?'
          const sub = [
            member.major,
            member.generation ? `${member.generation}기` : null,
            member.company,
          ].filter(Boolean).join(' · ')

          return (
            <button
              key={member.id}
              onClick={() => setSelected(member)}
              className="bg-white rounded-[14px] px-4 py-3 flex items-center gap-3 text-left w-full hover:bg-gray-50 active:bg-gray-100 transition-colors"
              style={{ border: '0.5px solid var(--border)' }}
            >
              <AvatarImg name={displayName} url={member.avatar_url} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{displayName}</span>
                  {member.role === 'admin' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-white" style={{ background: 'var(--navy)' }}>
                      운영자
                    </span>
                  )}
                </div>
                {sub && <p className="text-xs text-muted mt-0.5 truncate">{sub}</p>}
              </div>
              <span className="text-muted text-lg shrink-0">›</span>
            </button>
          )
        })}
      </div>

      {selected && (
        <ProfileModal member={selected} onClose={() => setSelected(null)} isAdmin={isAdmin} currentUserId={currentUserId} />
      )}
    </div>
  )
}
