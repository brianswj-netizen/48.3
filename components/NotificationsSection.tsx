'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  message_text: string
  room_name: string | null
  room_id: string | null
  sender: { name: string | null; nickname: string | null } | null
}

type VoteAlert = {
  id: string
  title: string
  deadline: string | null
}

type ContentAlert = {
  id: string
  title: string
  ann_type: string
  created_at: string
}

type SapjilAlert = {
  id: string
  title: string
  content: string
  created_at: string
  author: { name: string | null; nickname: string | null } | null
}

type CreatureAlert = {
  id: string
  title: string
  description: string | null
  created_at: string
  author: { name: string | null; nickname: string | null } | null
}

function ddayLabel(deadline: string | null) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
}

function mentionSourceLabel(roomName: string) {
  if (roomName === '삽질기') return '삽질기'
  if (roomName === '제안') return '제안'
  return `${roomName} 채팅`
}

function mentionSourceHref(roomName: string, roomId: string | null) {
  if (roomName === '삽질기') return '/sapjil'
  if (roomName === '제안') return '/suggestions'
  return roomId ? `/chat/${roomId}` : '/chat'
}

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) setValue(JSON.parse(stored))
    } catch {}
  }, [key])

  function set(v: T) {
    setValue(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  }

  return [value, set]
}

export default function NotificationsSection({
  notifications,
  voteAlerts = [],
  contentAlerts = [],
  sapjilAlerts = [],
  creaturesAlerts = [],
}: {
  notifications: Notification[]
  voteAlerts?: VoteAlert[]
  contentAlerts?: ContentAlert[]
  sapjilAlerts?: SapjilAlert[]
  creaturesAlerts?: CreatureAlert[]
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [notifContent, setNotifContent] = useLocalStorage('notif_content_delivery', true)
  const [notifSapjil, setNotifSapjil] = useLocalStorage('notif_sapjil', true)
  const [notifCreatures, setNotifCreatures] = useLocalStorage('notif_creatures', true)

  // 로컬 상태로 관리 (클릭 시 삭제)
  const [localNotifications, setLocalNotifications] = useState(notifications)
  const [localContent, setLocalContent] = useState(contentAlerts)
  const [localSapjil, setLocalSapjil] = useState(sapjilAlerts)
  const [localCreatures, setLocalCreatures] = useState(creaturesAlerts)
  const [localVotes, setLocalVotes] = useState(voteAlerts)

  // 마운트 시 localStorage에서 dismissed ID 목록 읽어서 필터
  useEffect(() => {
    try {
      const dContent: string[] = JSON.parse(localStorage.getItem('dismissed_content_ids') ?? '[]')
      const dSapjil: string[] = JSON.parse(localStorage.getItem('dismissed_sapjil_ids') ?? '[]')
      const dCreatures: string[] = JSON.parse(localStorage.getItem('dismissed_creature_ids') ?? '[]')
      const dVotes: string[] = JSON.parse(localStorage.getItem('dismissed_vote_ids') ?? '[]')
      if (dContent.length) setLocalContent(prev => prev.filter(c => !dContent.includes(c.id)))
      if (dSapjil.length) setLocalSapjil(prev => prev.filter(s => !dSapjil.includes(s.id)))
      if (dCreatures.length) setLocalCreatures(prev => prev.filter(c => !dCreatures.includes(c.id)))
      if (dVotes.length) setLocalVotes(prev => prev.filter(v => !dVotes.includes(v.id)))
    } catch {}
  }, [])

  // 투표 마감 임박 (D-3 이내)
  const urgentVotes = localVotes.filter((v) => {
    if (!v.deadline) return false
    const diff = Math.ceil((new Date(v.deadline).getTime() - Date.now()) / 86400000)
    return diff >= 0 && diff <= 3
  })

  const visibleContent = notifContent ? localContent : []
  const visibleSapjil = notifSapjil ? localSapjil : []
  const visibleCreatures = notifCreatures ? localCreatures : []

  const hasNotifs = localNotifications.length > 0
  const totalCount = localNotifications.length + urgentVotes.length + visibleContent.length + visibleSapjil.length + visibleCreatures.length
  const shown = expanded ? localNotifications : localNotifications.slice(0, 1)

  // 멘션 알림: 읽음 처리 + 삭제
  const dismissMention = useCallback(async (id: string, href: string) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await fetch('/api/notifications/mentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
    } catch {}
    router.push(href)
  }, [router])

  // 기타 알림: 로컬에서 삭제 + localStorage에 ID 저장
  const dismissContent = (id: string) => {
    setLocalContent(prev => prev.filter(c => c.id !== id))
    saveDismissedId('dismissed_content_ids', id)
  }

  function saveDismissedId(key: string, id: string) {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      if (!ids.includes(id)) localStorage.setItem(key, JSON.stringify([...ids, id]))
    } catch {}
  }

  const dismissSapjil = (id: string) => {
    setLocalSapjil(prev => prev.filter(s => s.id !== id))
    saveDismissedId('dismissed_sapjil_ids', id)
  }
  const dismissCreature = (id: string) => {
    setLocalCreatures(prev => prev.filter(c => c.id !== id))
    saveDismissedId('dismissed_creature_ids', id)
  }
  const dismissVote = (id: string) => {
    setLocalVotes(prev => prev.filter(v => v.id !== id))
    saveDismissedId('dismissed_vote_ids', id)
  }

  return (
    <section>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900">🔔 알림</h2>
          {totalCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: '#EF4444' }}>
              {totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasNotifs && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--purple)' }}
            >
              {expanded ? '접기' : '전체보기'}
            </button>
          )}
          <button
            onClick={() => setShowSettings(v => !v)}
            className="text-muted text-sm p-0.5"
            title="알림 설정"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 알림 설정 패널 */}
      {showSettings && (
        <div className="mb-2 rounded-[14px] bg-white p-4 flex flex-col gap-3"
          style={{ border: '0.5px solid var(--border)' }}>
          <p className="text-xs font-bold text-gray-700">알림 설정</p>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">🤖 AI뉴스 / 💡 꿀팁 배달</p>
              <p className="text-xs text-muted mt-0.5">새 콘텐츠 등록 시 알림</p>
            </div>
            <div
              onClick={() => setNotifContent(!notifContent)}
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ background: notifContent ? 'var(--purple)' : '#D1D5DB' }}
            >
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: notifContent ? 'translateX(20px)' : 'translateX(0)' }} />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">🔧 삽질기 등록</p>
              <p className="text-xs text-muted mt-0.5">새 글 등록 시 알림</p>
            </div>
            <div
              onClick={() => setNotifSapjil(!notifSapjil)}
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ background: notifSapjil ? 'var(--purple)' : '#D1D5DB' }}
            >
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: notifSapjil ? 'translateX(20px)' : 'translateX(0)' }} />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">🛸 나의 피조물 등록</p>
              <p className="text-xs text-muted mt-0.5">새 피조물 등록 시 알림</p>
            </div>
            <div
              onClick={() => setNotifCreatures(!notifCreatures)}
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ background: notifCreatures ? 'var(--purple)' : '#D1D5DB' }}
            >
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: notifCreatures ? 'translateX(20px)' : 'translateX(0)' }} />
            </div>
          </label>
        </div>
      )}

      {/* 본문 */}
      <div className="rounded-[14px] overflow-hidden bg-white" style={{ border: '0.5px solid var(--border)' }}>
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-1.5">
            <span className="text-2xl">🔕</span>
            <p className="text-xs text-muted">새 알림이 없습니다</p>
          </div>
        ) : (
          <>
            {/* AI뉴스/꿀팁 알림 → 라운지(/chat)로 이동 */}
            {visibleContent.map((c, i) => {
              const isLast = i === visibleContent.length - 1 && urgentVotes.length === 0 && !hasNotifs && visibleSapjil.length === 0 && visibleCreatures.length === 0
              const isNews = c.ann_type === 'ai_news'
              return (
                <button
                  key={`content-${c.id}`}
                  onClick={() => { dismissContent(c.id); router.push('/chat') }}
                  className={`w-full px-4 py-3 hover:bg-purple-50 transition-colors flex items-start gap-3 text-left ${!isLast ? 'border-b border-border/50' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5"
                    style={{ background: isNews ? '#EDE9FE' : '#FEF9C3' }}>
                    {isNews ? '🤖' : '💡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--purple)' }}>
                      오늘의 AI 뉴스와 꿀팁이 배달됐어요
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{c.title}</p>
                  </div>
                  <span className="text-muted text-sm shrink-0">›</span>
                </button>
              )
            })}

            {/* 삽질기 새 글 알림 */}
            {visibleSapjil.map((s, i) => {
              const authorRaw = s.author as any
              const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw
              const authorName = author?.name ?? author?.nickname ?? ''
              const preview = s.content.split('\n').slice(0, 3).join(' ').slice(0, 80)
              const isLast = i === visibleSapjil.length - 1 && urgentVotes.length === 0 && !hasNotifs && visibleCreatures.length === 0
              return (
                <button
                  key={`sapjil-${s.id}`}
                  onClick={() => { dismissSapjil(s.id); router.push('/sapjil') }}
                  className={`w-full px-4 py-3 hover:bg-indigo-50 transition-colors flex items-start gap-3 text-left ${!isLast ? 'border-b border-border/50' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5"
                    style={{ background: '#EEF2FF' }}>
                    🔧
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: '#6366F1' }}>
                      {authorName ? `${authorName}님의 삽질기` : '새 삽질기 등록'}
                    </p>
                    <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">{s.title}</p>
                    {preview && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{preview}</p>
                    )}
                  </div>
                  <span className="text-muted text-sm shrink-0">›</span>
                </button>
              )
            })}

            {/* 나의 피조물 새 글 알림 */}
            {visibleCreatures.map((c, i) => {
              const authorRaw = c.author as any
              const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw
              const authorName = author?.name ?? author?.nickname ?? ''
              const isLast = i === visibleCreatures.length - 1 && urgentVotes.length === 0 && !hasNotifs
              return (
                <button
                  key={`creature-${c.id}`}
                  onClick={() => { dismissCreature(c.id); router.push('/creatures') }}
                  className={`w-full px-4 py-3 hover:bg-pink-50 transition-colors flex items-start gap-3 text-left ${!isLast ? 'border-b border-border/50' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5"
                    style={{ background: '#FDF2F8' }}>
                    🛸
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: '#BE185D' }}>
                      {authorName ? `${authorName}님의 피조물` : '새 피조물 등록'}
                    </p>
                    <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">{c.title}</p>
                    {c.description && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{c.description}</p>
                    )}
                  </div>
                  <span className="text-muted text-sm shrink-0">›</span>
                </button>
              )
            })}

            {/* 투표 마감 임박 알림 */}
            {urgentVotes.map((vote, i) => {
              const dday = ddayLabel(vote.deadline)
              const isLast = i === urgentVotes.length - 1 && !hasNotifs
              return (
                <button
                  key={`vote-${vote.id}`}
                  onClick={() => { dismissVote(vote.id); router.push('/votes') }}
                  className={`w-full px-4 py-3 hover:bg-orange-50 transition-colors flex items-start gap-3 text-left ${!isLast ? 'border-b border-border/50' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5"
                    style={{ background: '#FFF7ED' }}>
                    🗳️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: '#F97316' }}>
                      투표 마감 임박
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{vote.title}</p>
                  </div>
                  {dday && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: '#FFF7ED', color: '#F97316' }}>
                      {dday}
                    </span>
                  )}
                  <span className="text-muted text-sm shrink-0">›</span>
                </button>
              )
            })}

            {/* 멘션 알림 */}
            {shown.map((n, i) => {
              const senderRaw = n.sender
              const sender = Array.isArray(senderRaw) ? (senderRaw as any)[0] : senderRaw
              const senderName = sender?.name ?? sender?.nickname ?? '누군가'
              const sourceLabel = mentionSourceLabel(n.room_name ?? '')
              const href = mentionSourceHref(n.room_name ?? '', n.room_id)
              const isLast = i === shown.length - 1
              return (
                <button
                  key={n.id}
                  onClick={() => dismissMention(n.id, href)}
                  className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 text-left ${!isLast ? 'border-b border-border/50' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white mt-0.5"
                    style={{ background: 'var(--purple)' }}>
                    {senderName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--purple)' }}>
                      {senderName}님이 {sourceLabel}에서 언급했어요
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{n.message_text}</p>
                  </div>
                  <span className="text-muted text-sm shrink-0">›</span>
                </button>
              )
            })}

            {/* 펼치기 힌트 */}
            {!expanded && localNotifications.length > 1 && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full py-2.5 text-xs font-medium border-t border-border/50 hover:bg-gray-50 transition-colors"
                style={{ color: 'var(--purple)' }}
              >
                +{localNotifications.length - 1}개 더 보기
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
