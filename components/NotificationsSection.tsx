'use client'

import { useState } from 'react'
import Link from 'next/link'

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

export default function NotificationsSection({ notifications, voteAlerts = [] }: { notifications: Notification[]; voteAlerts?: VoteAlert[] }) {
  const [expanded, setExpanded] = useState(false)

  // Only show votes with deadlines within 3 days (and not yet passed)
  const urgentVotes = voteAlerts.filter((v) => {
    if (!v.deadline) return false
    const diff = Math.ceil((new Date(v.deadline).getTime() - Date.now()) / 86400000)
    return diff >= 0 && diff <= 3
  })

  const hasNotifs = notifications.length > 0
  const totalCount = notifications.length + urgentVotes.length
  const shown = expanded ? notifications : notifications.slice(0, 1)

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
        {hasNotifs && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--purple)' }}
          >
            {expanded ? '접기' : '전체보기'}
          </button>
        )}
      </div>

      {/* 본문 */}
      <div className="rounded-[14px] overflow-hidden bg-white" style={{ border: '0.5px solid var(--border)' }}>
        {totalCount === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-6 gap-1.5">
            <span className="text-2xl">🔕</span>
            <p className="text-xs text-muted">새 알림이 없습니다</p>
          </div>
        ) : (
          <>
            {/* 투표 마감 임박 알림 */}
            {urgentVotes.map((vote, i) => {
              const dday = ddayLabel(vote.deadline)
              const isLast = i === urgentVotes.length - 1 && !hasNotifs
              return (
                <Link key={`vote-${vote.id}`} href="/votes">
                  <div className={`px-4 py-3 hover:bg-orange-50 transition-colors flex items-start gap-3 ${!isLast ? 'border-b border-border/50' : ''}`}>
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
                  </div>
                </Link>
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
                <Link key={n.id} href={href}>
                  <div className={`px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!isLast ? 'border-b border-border/50' : ''}`}>
                    {/* 아이콘 */}
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
                  </div>
                </Link>
              )
            })}

            {/* 펼치기 힌트 (collapsed + 2개 이상일 때) */}
            {!expanded && notifications.length > 1 && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full py-2.5 text-xs font-medium border-t border-border/50 hover:bg-gray-50 transition-colors"
                style={{ color: 'var(--purple)' }}
              >
                +{notifications.length - 1}개 더 보기
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
