'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { UserProfile } from '@/lib/user'

const SUBGROUPS = [
  { value: '입문반', label: '🌱 입문반', desc: 'AI 처음이에요' },
  { value: '중급반', label: '⚡ 중급반', desc: '실무에 써보고 싶어요' },
  { value: '고급반', label: '🚀 고급반', desc: '직접 만들어볼게요' },
]

const NOTIF_LABELS = [
  { key: 'announcement', label: '새 공지사항' },
  { key: 'event',        label: '일정 D-1 알림' },
  { key: 'mention',      label: '@멘션 알림' },
  { key: 'newDoc',       label: '새 자료 업로드' },
  { key: 'voteDeadline', label: '투표 마감 임박' },
] as const

const MAJORS = [
  { value: '글프', label: '글프' },
  { value: '건개', label: '건개' },
  { value: '경관', label: '경관' },
  { value: '금투', label: '금투' },
]

function getKSTNow() {
  return new Date(new Date().getTime() + 9 * 60 * 60 * 1000)
}

function canChangeSubgroup(user: UserProfile): { allowed: boolean; reason?: string } {
  if (user.role === 'admin') return { allowed: true }
  if (!user.subgroup) return { allowed: true }

  const nowKST = getKSTNow()
  const dayOfWeek = nowKST.getDay()

  if (dayOfWeek !== 0) {
    const daysUntilSunday = 7 - dayOfWeek
    const nextSunday = new Date(nowKST)
    nextSunday.setDate(nowKST.getDate() + daysUntilSunday)
    return {
      allowed: false,
      reason: `소모임 변경은 일요일에만 가능해요 (다음 일요일: ${nextSunday.getMonth() + 1}월 ${nextSunday.getDate()}일)`,
    }
  }

  if (user.subgroup_changed_at) {
    const lastChanged = new Date(user.subgroup_changed_at)
    const diffMs = new Date().getTime() - lastChanged.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays < 7) {
      const nextAvailable = new Date(lastChanged.getTime() + 7 * 24 * 60 * 60 * 1000)
      const kst = new Date(nextAvailable.getTime() + 9 * 60 * 60 * 1000)
      const daysUntil = (7 - kst.getDay()) % 7 || 7
      kst.setDate(kst.getDate() + daysUntil)
      return {
        allowed: false,
        reason: `마지막 변경 후 1주일이 지나야 해요 (다음 가능일: ${kst.getMonth() + 1}월 ${kst.getDate()}일 일요일)`,
      }
    }
  }

  return { allowed: true }
}

export default function SettingsClient({ user }: { user: UserProfile }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requireSubgroup = searchParams.get('require_subgroup') === '1'
  const tabNotif = searchParams.get('tab') === 'notif'

  // 사진
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notifSectionRef = useRef<HTMLElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  // 소개
  const [bio, setBio] = useState(user.bio ?? '')
  const [savingBio, setSavingBio] = useState(false)
  const [bioSaved, setBioSaved] = useState(false)

  // 프로필
  const [major, setMajor] = useState(user.major ?? '')
  const [generation, setGeneration] = useState(user.generation?.toString() ?? '')
  const [birthYear, setBirthYear] = useState(user.birth_year?.toString() ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [company, setCompany] = useState(user.company ?? '')
  const [position, setPosition] = useState(user.position ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  // 소모임
  const [subgroup, setSubgroup] = useState(user.subgroup ?? '')
  const [savingSubgroup, setSavingSubgroup] = useState(false)
  const [subgroupSaved, setSubgroupSaved] = useState(false)
  const [subgroupError, setSubgroupError] = useState('')

  const [notifs, setNotifs] = useState({
    announcement: true, event: true, mention: true, newDoc: false, voteDeadline: true,
  })
  const [notifExpanded, setNotifExpanded] = useState(tabNotif)

  useEffect(() => {
    if (tabNotif && notifSectionRef.current) {
      setTimeout(() => {
        notifSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [])

  // 글씨 크기 설정
  const [appFontSize, setAppFontSize] = useState<'normal' | 'large'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('appFontSize') as 'normal' | 'large') ?? 'normal'
    }
    return 'normal'
  })

  function handleFontSizeChange(size: 'normal' | 'large') {
    setAppFontSize(size)
    localStorage.setItem('appFontSize', size)
    if (size === 'large') document.documentElement.classList.add('font-large')
    else document.documentElement.classList.remove('font-large')
  }

  const changeCheck = canChangeSubgroup(user)
  const isFirstSelection = !user.subgroup

  const toggleNotif = (key: keyof typeof notifs) =>
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))

  // 사진 업로드
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError('')
    setUploadingAvatar(true)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/user/avatar', { method: 'POST', body: formData })
    const json = await res.json()
    setUploadingAvatar(false)

    if (!res.ok) {
      setAvatarError(json.error ?? '업로드 실패')
      return
    }
    setAvatarUrl(json.avatar_url)
    router.refresh()
  }

  // 소개 저장
  async function saveBio() {
    setSavingBio(true)
    setBioSaved(false)
    await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio }),
    })
    setSavingBio(false)
    setBioSaved(true)
    setTimeout(() => setBioSaved(false), 2000)
  }

  // 프로필 저장
  async function saveProfile() {
    setProfileError('')
    setSavingProfile(true)
    setProfileSaved(false)

    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        major: major || null,
        generation: generation ? Number(generation) : null,
        birth_year: birthYear ? Number(birthYear) : null,
        phone: phone || null,
        company: company || null,
        position: position || null,
      }),
    })

    const json = await res.json()
    setSavingProfile(false)

    if (!res.ok) {
      setProfileError(json.error ?? '저장 실패')
      return
    }

    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  // 소모임 저장
  async function saveSubgroup(value: string) {
    if (!changeCheck.allowed) return
    setSubgroupError('')
    setSubgroup(value)
    setSavingSubgroup(true)
    setSubgroupSaved(false)

    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subgroup: value }),
    })

    const json = await res.json()
    setSavingSubgroup(false)

    if (!res.ok) {
      setSubgroupError(json.error ?? '저장 실패')
      setSubgroup(user.subgroup ?? '')
      return
    }

    setSubgroupSaved(true)
    setTimeout(() => {
      setSubgroupSaved(false)
      router.refresh()
    }, 1500)
  }

  const displayName = user.name ?? user.nickname ?? '?'

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#7A9840' }}>
        <h1 className="text-xl font-black text-white">설정</h1>
      </header>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* 소모임 강제 안내 */}
        {requireSubgroup && (
          <div className="rounded-[14px] px-4 py-3 flex items-start gap-2"
            style={{ background: 'var(--purple-light)', border: '1px solid var(--purple)' }}>
            <span className="text-lg mt-0.5">👋</span>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--purple)' }}>소모임을 먼저 선택해주세요</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--purple)' }}>
                채팅방을 이용하려면 아래에서 소모임을 선택해야 해요.
              </p>
            </div>
          </div>
        )}

        {/* 내 정보 + 사진 변경 */}
        <section className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
          <p className="text-sm font-bold text-gray-900 mb-3">내 정보</p>
          <div className="flex items-center gap-4">
            {/* 아바타 + 업로드 버튼 */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName}
                  className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{ background: 'var(--purple)' }}>
                  {displayName.charAt(0)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-border flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
              >
                {uploadingAvatar ? (
                  <span className="text-[10px] text-muted">...</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17 8L12 3L7 8" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1">
              <p className="font-bold text-gray-900">{displayName}</p>
              <p className="text-xs text-muted">{user.nickname}</p>
              {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
              <p className="text-xs text-muted mt-1">사진 아이콘을 눌러 변경하세요</p>
            </div>
          </div>
        </section>

        {/* 프로필 정보 */}
        <section className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">프로필 정보</p>
            {profileSaved && <span className="text-xs font-medium" style={{ color: 'var(--teal)' }}>✓ 저장됨</span>}
          </div>

          {profileError && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
              <p className="text-xs text-red-500">{profileError}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* 전공 */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1.5 block">전공</label>
              <select
                value={major}
                onChange={e => setMajor(e.target.value)}
                className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 bg-white"
              >
                <option value="">선택하세요</option>
                {MAJORS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* 기수 + 출생연도 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted mb-1.5 block">기수</label>
                <input
                  type="number"
                  value={generation}
                  onChange={e => setGeneration(e.target.value)}
                  placeholder="예: 48"
                  min={1} max={99}
                  className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted mb-1.5 block">출생연도</label>
                <input
                  type="number"
                  value={birthYear}
                  onChange={e => setBirthYear(e.target.value)}
                  placeholder="예: 1985"
                  min={1950} max={2005}
                  className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* 연락처 */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1.5 block">연락처</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
              />
            </div>

            {/* 직장명 */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1.5 block">직장명</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="회사명"
                maxLength={100}
                className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
              />
            </div>

            {/* 직급 */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1.5 block">직급</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="직급 / 직책"
                maxLength={100}
                className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--purple)' }}
          >
            {savingProfile ? '저장 중...' : '프로필 저장'}
          </button>
        </section>

        {/* 내 소개 */}
        <section className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
          <p className="text-sm font-bold text-gray-900 mb-3">내 소개</p>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="자신을 간단히 소개해주세요..."
            maxLength={200}
            className="w-full text-sm text-gray-800 border border-border rounded-xl p-3 resize-none h-24 outline-none focus:border-purple-500 transition-colors"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted">{bio.length}/200</span>
            <button
              onClick={saveBio}
              disabled={savingBio}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'var(--purple)' }}
            >
              {savingBio ? '저장 중...' : bioSaved ? '✓ 저장됨' : '저장'}
            </button>
          </div>
        </section>

        {/* 소모임 선택 */}
        <section className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-gray-900">소모임 선택</p>
            {subgroupSaved && <span className="text-xs font-medium" style={{ color: 'var(--teal)' }}>✓ 저장됨</span>}
            {savingSubgroup && <span className="text-xs text-muted">저장 중...</span>}
          </div>

          {isFirstSelection ? (
            <p className="text-xs text-muted mb-3">
              소모임을 선택하면 해당 소모임 채팅방을 이용할 수 있어요.{' '}
              <span className="font-semibold text-gray-700">일요일에만 변경</span> 가능하며,
              변경 후 <span className="font-semibold text-gray-700">1주일간 유지</span>됩니다.
            </p>
          ) : (
            <p className="text-xs text-muted mb-3">
              소모임 변경은 <span className="font-semibold text-gray-700">매주 일요일</span>에만 가능하며,
              변경 후 <span className="font-semibold text-gray-700">1주일간 유지</span>됩니다.
            </p>
          )}

          {!changeCheck.allowed && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-border">
              <p className="text-xs text-muted">🔒 {changeCheck.reason}</p>
            </div>
          )}

          {subgroupError && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
              <p className="text-xs text-red-500">{subgroupError}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {SUBGROUPS.map(opt => {
              const isSelected = subgroup === opt.value
              const isDisabled = !changeCheck.allowed && !isSelected
              return (
                <button
                  key={opt.value}
                  onClick={() => saveSubgroup(opt.value)}
                  disabled={isDisabled}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    isSelected ? 'border-purple-500 bg-purple-50'
                      : isDisabled ? 'border-border bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-border hover:bg-gray-50'
                  }`}
                  style={isSelected ? { borderColor: 'var(--purple)', background: 'var(--purple-light)' } : {}}
                >
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: isSelected ? 'var(--purple)' : 'var(--border)' }}>
                    {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--purple)' }} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-muted">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* 알림 설정 */}
        <section ref={notifSectionRef} className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
          <button
            onClick={() => setNotifExpanded(v => !v)}
            className="w-full flex items-center justify-between"
          >
            <p className="text-sm font-bold text-gray-900">알림 설정</p>
            <span className="text-muted text-sm transition-transform" style={{ display: 'inline-block', transform: notifExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>∨</span>
          </button>
          {notifExpanded && (
            <>
              <div className="flex flex-col gap-3 mt-3">
                {NOTIF_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-800">{label}</span>
                    <button
                      onClick={() => toggleNotif(key)}
                      className="shrink-0 rounded-full transition-colors relative"
                      style={{
                        width: 44, height: 24,
                        background: notifs[key] ? 'var(--purple)' : 'var(--border)',
                      }}
                    >
                      <span
                        className="absolute bg-white rounded-full shadow"
                        style={{
                          width: 20, height: 20,
                          top: 2,
                          left: notifs[key] ? 22 : 2,
                          transition: 'left 0.15s',
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-3">* 알림 기능은 PWA 설치 후 지원됩니다</p>
            </>
          )}
        </section>

        {/* 화면 설정 */}
        <section className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
          <p className="text-sm font-bold text-gray-900 mb-3">화면 설정</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">글씨 크기</p>
              <p className="text-xs text-muted mt-0.5">앱 전체 텍스트 크기를 조절합니다</p>
            </div>
            <div className="flex gap-1.5">
              {(['normal', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => handleFontSizeChange(size)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                  style={appFontSize === size
                    ? { background: 'var(--purple)', color: 'white' }
                    : { background: '#F3F4F6', color: '#6B7280' }}
                >
                  {size === 'normal' ? '기본' : '크게'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 계정 */}
        <section className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
          <p className="text-sm font-bold text-gray-900 mb-3">계정</p>
          <a href="/api/auth/signout"
            className="block text-center py-2.5 rounded-xl border border-border text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            로그아웃
          </a>
        </section>

      </div>
    </div>
  )
}
