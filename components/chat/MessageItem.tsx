'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import type { Message } from '@/lib/types'
import DailyCardMessage, { type DailyCardData, type ReactionData as CardReactionData } from './DailyCardMessage'
import CardCommentDrawer from './CardCommentDrawer'

const DAILY_CARD_PREFIX = '__DAILY_CARD__:'
const COLLAPSE_THRESHOLD = 150

// 작가 컬러 팔레트 기반 퀵 리액션
const QUICK_REACTIONS = [
  { emoji: '❤️', bg: '#FAEDE8', active: '#E07B54' },
  { emoji: '😂', bg: '#FAF0D8', active: '#C89030' },
  { emoji: '👍', bg: '#DFF0F8', active: '#2880A0' },
  { emoji: '🙏', bg: '#EDEBFA', active: '#7B6FC4' },
  { emoji: '🔥', bg: '#FAE8E8', active: '#C04030' },
  { emoji: '😮', bg: '#E8F0FA', active: '#4A80BE' },
]

function parseDailyCard(text: string): DailyCardData | null {
  if (!text.startsWith(DAILY_CARD_PREFIX)) return null
  try { return JSON.parse(text.slice(DAILY_CARD_PREFIX.length)) as DailyCardData }
  catch { return null }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const initial = name?.charAt(0) ?? '?'
  if (avatarUrl && !imgError) return (
    <Image
      src={avatarUrl} alt={name} width={size} height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  )
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
      style={{ width: size, height: size, background: 'var(--purple)' }}>
      {initial}
    </div>
  )
}

export type ReactionData = { emoji: string; count: number; mine: boolean }

type Props = {
  message: Message
  isMine: boolean
  showSender: boolean
  isAdmin?: boolean
  fontSize?: 'normal' | 'large'
  reactions?: ReactionData[]
  currentUserId?: string
  onDelete?: (id: string) => void
  onEdit?: (id: string, newText: string) => void
  onReaction?: (emoji: string) => void
}

export default function MessageItem({
  message, isMine, showSender, isAdmin, fontSize = 'normal',
  reactions = [], currentUserId, onDelete, onEdit, onReaction,
}: Props) {
  const sender = message.sender
  const displayName = sender?.name ?? sender?.nickname ?? '알 수 없음'
  const time = formatTime(message.created_at)
  const textClass = fontSize === 'large' ? 'text-base' : 'text-sm'

  const textOnly = message.text.split('\n').filter((l: string) => !l.startsWith('__IMAGE__:')).join('\n')
  const isLong = textOnly.length > COLLAPSE_THRESHOLD
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [savingEdit, setSavingEdit] = useState(false)
  const [showReactPicker, setShowReactPicker] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [cardCommentCount, setCardCommentCount] = useState(0)

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startLongPress() {
    if (isMine) return  // 본인 메시지에는 리액션 불가
    pressTimer.current = setTimeout(() => setShowReactPicker(true), 500)
  }
  function cancelLongPress() {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null }
  }

  const canEdit = isMine
  const canDelete = isMine || isAdmin

  async function handleDelete() {
    if (!confirm('메시지를 삭제할까요?')) return
    const res = await fetch(`/api/chat/${message.room_id}/messages/${message.id}`, { method: 'DELETE' })
    if (res.ok) onDelete?.(message.id)
  }

  async function handleSaveEdit() {
    if (!editText.trim() || savingEdit) return
    setSavingEdit(true)
    const res = await fetch(`/api/chat/${message.room_id}/messages/${message.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText.trim() }),
    })
    setSavingEdit(false)
    if (res.ok) { onEdit?.(message.id, editText.trim()); setEditing(false) }
  }

  // ─── 데일리 카드 ───
  const cardData = parseDailyCard(message.text)
  if (cardData) {
    return (
      <div className="px-4 mb-3">
        {showSender && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: '#DFF0F8' }}>📰</div>
            <span className="text-xs font-semibold text-gray-700">{displayName}</span>
          </div>
        )}
        <DailyCardMessage
          data={cardData}
          reactions={reactions as CardReactionData[]}
          onReaction={isMine ? undefined : onReaction}
          commentCount={cardCommentCount}
          onOpenComments={() => setShowComments(true)}
        />
        <span className="text-[10px] text-muted mt-1 block">{time}</span>
        <CardCommentDrawer
          messageId={message.id}
          roomId={message.room_id}
          currentUserId={currentUserId ?? ''}
          isAdmin={isAdmin}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          onCountChange={setCardCommentCount}
        />
      </div>
    )
  }

  const displayText = isLong && !expanded ? textOnly.slice(0, COLLAPSE_THRESHOLD) + '…' : message.text

  // @멘션 하이라이트 렌더링
  function renderWithMentions(text: string) {
    const parts = text.split(/(@[^\s@,!?。]+)/g)
    return parts.map((part, i) =>
      part.startsWith('@')
        ? <span key={i} className="font-semibold" style={{ color: '#C4B5FD' }}>{part}</span>
        : <span key={i}>{part}</span>
    )
  }

  function renderMessageContent(text: string) {
    const lines = text.split('\n')
    const imageLines = lines.filter(l => l.startsWith('__IMAGE__:'))
    const textLines = lines.filter(l => !l.startsWith('__IMAGE__:'))
    const textPart = textLines.join('\n').trim()
    const imageUrls = imageLines.map(l => l.replace('__IMAGE__:', ''))
    return (
      <>
        {textPart && <span>{renderWithMentions(textPart)}</span>}
        {imageUrls.map((url, i) => (
          <img key={i} src={url} alt="첨부 이미지"
            className="mt-1.5 rounded-xl max-w-full object-cover block"
            style={{ maxHeight: 240, cursor: 'pointer' }}
            onClick={() => window.open(url, '_blank')}
          />
        ))}
      </>
    )
  }

  // ─── 퀵 리액션 피커 ───
  const ReactionPicker = () => (
    <>
      <div className="fixed inset-0 z-20" onClick={() => setShowReactPicker(false)} />
      <div className={`relative z-30 flex items-center gap-1.5 px-3 py-2 bg-white rounded-2xl shadow-xl border border-border mb-1 ${isMine ? 'self-end' : 'self-start ml-9'}`}>
        {QUICK_REACTIONS.map(({ emoji, bg, active }) => {
          const reaction = reactions.find(r => r.emoji === emoji)
          const hasMyReaction = reaction?.mine ?? false
          const count = reaction?.count ?? 0
          return (
            <button key={emoji}
              onClick={() => { onReaction?.(emoji); setShowReactPicker(false) }}
              className="flex flex-col items-center justify-center w-10 h-10 rounded-full transition-transform active:scale-90"
              style={{ background: hasMyReaction ? active + '33' : bg, border: hasMyReaction ? `1.5px solid ${active}` : 'none' }}>
              <span className="text-lg leading-none">{emoji}</span>
              {count > 0 && <span className="text-[9px] font-bold leading-none mt-0.5" style={{ color: hasMyReaction ? active : '#6B7280' }}>{count}</span>}
            </button>
          )
        })}
      </div>
    </>
  )

  // ─── 이모티콘 뱃지 ───
  const ReactionBadges = () => reactions.length > 0 ? (
    <div className={`flex flex-wrap gap-1 mt-1.5 ${isMine ? 'justify-end' : 'ml-9'}`}>
      {reactions.map(r => (
        <button key={r.emoji}
          onClick={() => onReaction?.(r.emoji)}
          className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-colors"
          style={r.mine
            ? { background: 'var(--purple)', color: 'white', border: 'none' }
            : { background: 'white', color: '#374151', border: '1px solid var(--border)' }}>
          <span className="text-sm">{r.emoji}</span>
          <span className="font-semibold text-[11px]">{r.count}</span>
        </button>
      ))}
    </div>
  ) : null

  // ─── 내 메시지 ───
  if (isMine) return (
    <div className="flex flex-col items-end px-4 mb-1">
      {showReactPicker && <div className="flex flex-col items-end w-full"><ReactionPicker /></div>}
      <div className="max-w-[75%]">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <textarea value={editText} onChange={e => setEditText(e.target.value)}
              className="text-sm border border-purple-400 rounded-2xl px-3.5 py-2.5 outline-none resize-none leading-relaxed bg-white text-gray-900 w-full"
              rows={3} autoFocus />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="text-xs text-muted px-2 py-1">취소</button>
              <button onClick={handleSaveEdit} disabled={savingEdit}
                className="text-xs font-semibold px-3 py-1 rounded-full text-white disabled:opacity-50"
                style={{ background: 'var(--purple)' }}>
                {savingEdit ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`px-3.5 py-2.5 rounded-2xl rounded-tr-sm ${textClass} text-white leading-relaxed whitespace-pre-wrap`}
            style={{ background: 'var(--purple)', userSelect: 'none' }}
            onMouseDown={startLongPress} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
            onContextMenu={e => e.preventDefault()}>
            {renderMessageContent(displayText)}
            {message.edited && <span className="text-white/60 text-[10px] ml-1">(수정됨)</span>}
          </div>
        )}
        {!editing && isLong && (
          <div className="flex justify-end mt-1">
            <button onClick={() => setExpanded(v => !v)} className="text-[11px] font-medium" style={{ color: 'var(--purple)' }}>
              {expanded ? '접기 ↑' : '더 보기 ↓'}
            </button>
          </div>
        )}
        {!editing && (canEdit || canDelete) && (
          <div className="flex justify-end gap-2 mt-0.5">
            {canEdit && <button onClick={() => { setEditText(message.text); setEditing(true) }} className="text-[10px] text-muted hover:text-gray-500">수정</button>}
            {canDelete && <button onClick={handleDelete} className="text-[10px] text-red-300 hover:text-red-500">삭제</button>}
          </div>
        )}
        <ReactionBadges />
        <span className="text-[10px] text-muted text-right block mt-0.5">{time}</span>
      </div>
    </div>
  )

  // ─── 상대방 메시지 ───
  return (
    <div className="flex flex-col px-4 mb-1">
      {showReactPicker && <ReactionPicker />}
      <div className="flex items-start gap-2">
        {/* 아바타 */}
        <div className="shrink-0 mt-0.5" style={{ width: 36 }}>
          {showSender
            ? <Avatar name={displayName} avatarUrl={sender?.avatar_url} size={36} />
            : <div style={{ width: 36, height: 36 }} />}
        </div>
        {/* 오른쪽: 이름+시간 헤더 + 말풍선 */}
        <div className="flex flex-col max-w-[72%]">
          {showSender && (
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-[11px] font-semibold text-gray-700 leading-none">{displayName}</span>
              <span className="text-[10px] text-muted leading-none">{time}</span>
            </div>
          )}
          <div
            className={`px-3.5 py-2.5 rounded-2xl rounded-tl-sm ${textClass} text-gray-900 bg-white border border-border leading-relaxed whitespace-pre-wrap`}
            style={{ userSelect: 'none' }}
            onMouseDown={startLongPress} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
            onContextMenu={e => { e.preventDefault(); setShowReactPicker(true) }}>
            {renderMessageContent(displayText)}
            {message.edited && <span className="text-gray-400 text-[10px] ml-1">(수정됨)</span>}
          </div>
          {isLong && (
            <button onClick={() => setExpanded(v => !v)}
              className="text-[11px] font-medium mt-1 self-start" style={{ color: 'var(--purple)' }}>
              {expanded ? '접기 ↑' : '더 보기 ↓'}
            </button>
          )}
          {canDelete && (
            <div className="flex gap-2 mt-0.5">
              <button onClick={handleDelete} className="text-[10px] text-red-300 hover:text-red-500">삭제</button>
            </div>
          )}
          <ReactionBadges />
          {!showSender && (
            <span className="text-[10px] text-muted mt-0.5">{time}</span>
          )}
        </div>
      </div>
    </div>
  )
}
