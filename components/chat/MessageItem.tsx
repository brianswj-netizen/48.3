'use client'

import { useRef, useState } from 'react'
import type { Message } from '@/lib/types'
import DailyCardMessage, { type DailyCardData, type ReactionData as CardReactionData } from './DailyCardMessage'
import CardCommentDrawer from './CardCommentDrawer'

const DAILY_CARD_PREFIX = '__DAILY_CARD__:'
const COLLAPSE_THRESHOLD = 150

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

function Avatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const initial = name?.charAt(0) ?? '?'
  if (avatarUrl && !imgError) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt={name} className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }} onError={() => setImgError(true)} />
  )
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
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
  onReply?: (message: Message) => void
}

// ── 인용 블록 파싱 ─────────────────────────────────────────────
function parseReply(text: string): { quoteLines: string[]; bodyLines: string[] } {
  const lines = text.split('\n')
  const quoteLines: string[] = []
  const bodyLines: string[] = []
  let inQuote = true
  for (const line of lines) {
    if (inQuote && line.startsWith('> ')) quoteLines.push(line.slice(2))
    else { inQuote = false; bodyLines.push(line) }
  }
  return { quoteLines, bodyLines: bodyLines.join('\n').startsWith('\n') ? bodyLines.slice(1) : bodyLines }
}

export default function MessageItem({
  message, isMine, showSender, isAdmin, fontSize = 'normal',
  reactions = [], currentUserId, onDelete, onEdit, onReaction, onReply,
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
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [cardCommentCount, setCardCommentCount] = useState(0)

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startLongPress() {
    pressTimer.current = setTimeout(() => setShowContextMenu(true), 500)
  }
  function cancelLongPress() {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null }
  }

  const canEdit = isMine
  const canDelete = isMine || isAdmin

  async function handleDelete() {
    setShowContextMenu(false)
    if (!confirm('메시지를 삭제할까요?')) return
    const res = await fetch(`/api/chat/${message.room_id}/messages/${message.id}`, { method: 'DELETE' })
    if (res.ok) onDelete?.(message.id)
  }

  async function handleSaveEdit() {
    if (!editText.trim() || savingEdit) return
    setSavingEdit(true)
    const res = await fetch(`/api/chat/${message.room_id}/messages/${message.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText.trim() }),
    })
    setSavingEdit(false)
    if (res.ok) { onEdit?.(message.id, editText.trim()); setEditing(false) }
  }

  function handleCopy() {
    setShowContextMenu(false)
    const plain = message.text.split('\n')
      .filter(l => !l.startsWith('__IMAGE__:'))
      .join('\n').trim()
    navigator.clipboard.writeText(plain).catch(() => {})
  }

  function handleSelectCopy() {
    setShowContextMenu(false)
    setSelectMode(true)
  }

  function handleReply() {
    setShowContextMenu(false)
    onReply?.(message)
  }

  // ─── 데일리 카드 ───
  const cardData = parseDailyCard(message.text)
  if (cardData) {
    return (
      <div className="px-4 mb-1">
        {showSender && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: '#DFF0F8' }}>📰</div>
            <span className="text-xs font-semibold text-gray-700">{displayName}</span>
          </div>
        )}
        <DailyCardMessage data={cardData} reactions={reactions as CardReactionData[]}
          onReaction={isMine ? undefined : onReaction}
          commentCount={cardCommentCount} onOpenComments={() => setShowComments(true)} />
        <span className="text-[10px] text-muted mt-0.5 block">{time}</span>
        <CardCommentDrawer messageId={message.id} roomId={message.room_id}
          currentUserId={currentUserId ?? ''} isAdmin={isAdmin}
          isOpen={showComments} onClose={() => setShowComments(false)} onCountChange={setCardCommentCount} />
      </div>
    )
  }

  const displayText = isLong && !expanded ? textOnly.slice(0, COLLAPSE_THRESHOLD) + '…' : message.text
  const { quoteLines, bodyLines } = parseReply(displayText)
  const hasQuote = quoteLines.length > 0

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
            className="mt-1 rounded-xl max-w-full object-cover block"
            style={{ maxHeight: 220, cursor: 'pointer' }}
            onClick={() => window.open(url, '_blank')} />
        ))}
      </>
    )
  }

  // ─── 리액션 배지 ───
  const ReactionBadges = () => reactions.length > 0 ? (
    <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'ml-8'}`}>
      {reactions.map(r => (
        <button key={r.emoji} onClick={() => onReaction?.(r.emoji)}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors"
          style={r.mine
            ? { background: 'var(--purple)', color: 'white' }
            : { background: 'white', color: '#374151', border: '1px solid var(--border)' }}>
          <span className="text-sm">{r.emoji}</span>
          <span className="font-semibold text-[11px]">{r.count}</span>
        </button>
      ))}
    </div>
  ) : null

  // ─── 컨텍스트 메뉴 (카카오톡 스타일) ───
  const ContextMenu = () => (
    <>
      <div className="fixed inset-0 z-[49] bg-black/20" onClick={() => setShowContextMenu(false)} />
      <div className="fixed bottom-0 left-0 right-0 z-[50] bg-white rounded-t-2xl overflow-hidden shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* 리액션 행 (본인 메시지에는 숨김) */}
        {!isMine && (
          <div className="flex items-center justify-around px-4 py-3 border-b border-border/50">
            {QUICK_REACTIONS.map(({ emoji, bg, active }) => {
              const r = reactions.find(rx => rx.emoji === emoji)
              const mine = r?.mine ?? false
              const count = r?.count ?? 0
              return (
                <button key={emoji}
                  onClick={() => { onReaction?.(emoji); setShowContextMenu(false) }}
                  className="flex flex-col items-center justify-center w-11 h-11 rounded-full active:scale-90 transition-transform"
                  style={{ background: mine ? active + '33' : bg, border: mine ? `1.5px solid ${active}` : 'none' }}>
                  <span className="text-xl leading-none">{emoji}</span>
                  {count > 0 && <span className="text-[9px] font-bold mt-0.5" style={{ color: mine ? active : '#6B7280' }}>{count}</span>}
                </button>
              )
            })}
          </div>
        )}
        {/* 액션 목록 */}
        <div className="flex flex-col">
          <button onClick={handleCopy}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 border-b border-border/30">
            <span className="text-lg">📋</span>
            <span className="text-sm font-medium text-gray-800">복사</span>
          </button>
          <button onClick={handleSelectCopy}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 border-b border-border/30">
            <span className="text-lg">✏️</span>
            <span className="text-sm font-medium text-gray-800">선택 복사</span>
          </button>
          <button onClick={handleReply}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 border-b border-border/30">
            <span className="text-lg">↩️</span>
            <span className="text-sm font-medium text-gray-800">답장</span>
          </button>
          {canEdit && (
            <button onClick={() => { setShowContextMenu(false); setEditText(message.text); setEditing(true) }}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 border-b border-border/30">
              <span className="text-lg">✍️</span>
              <span className="text-sm font-medium text-gray-800">수정</span>
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 active:bg-red-100 border-b border-border/30">
              <span className="text-lg">🗑️</span>
              <span className="text-sm font-medium text-red-500">삭제</span>
            </button>
          )}
          <button onClick={() => setShowContextMenu(false)}
            className="flex items-center justify-center px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100">
            <span className="text-sm font-semibold text-muted">취소</span>
          </button>
        </div>
      </div>
    </>
  )

  // ─── 선택 복사 모달 ───
  const SelectCopyModal = () => (
    <>
      <div className="fixed inset-0 z-[49] bg-black/30" onClick={() => setSelectMode(false)} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[50] bg-white rounded-2xl p-4 shadow-2xl">
        <p className="text-xs font-bold text-muted mb-2">텍스트 선택 후 복사</p>
        <textarea
          readOnly
          defaultValue={message.text.split('\n').filter(l => !l.startsWith('__IMAGE__:')).join('\n').trim()}
          className="w-full text-sm text-gray-800 leading-relaxed outline-none resize-none rounded-xl p-3"
          style={{ border: '1px solid var(--border)', background: '#FAF9F8', minHeight: 100 }}
          onFocus={e => e.target.select()}
        />
        <button onClick={() => setSelectMode(false)}
          className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700">
          닫기
        </button>
      </div>
    </>
  )

  // ─── 내 메시지 ───
  if (isMine) return (
    <div className="flex flex-col items-end px-4 mb-0.5">
      {showContextMenu && <ContextMenu />}
      {selectMode && <SelectCopyModal />}
      <div className="max-w-[75%]">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <textarea value={editText} onChange={e => setEditText(e.target.value)}
              className="text-sm border border-purple-400 rounded-2xl px-3 py-2 outline-none resize-none leading-relaxed bg-white text-gray-900 w-full"
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
            className={`px-3 py-2 rounded-2xl rounded-tr-sm ${textClass} text-white leading-relaxed whitespace-pre-wrap`}
            style={{ background: 'var(--purple)', userSelect: 'none' }}
            onMouseDown={startLongPress} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
            onContextMenu={e => { e.preventDefault(); setShowContextMenu(true) }}>
            {hasQuote && (
              <div className="mb-1.5 pl-2 border-l-2 border-white/50 opacity-70 text-xs">
                {quoteLines.join('\n')}
              </div>
            )}
            {renderMessageContent(hasQuote ? bodyLines.join('\n') : displayText)}
            {message.edited && <span className="text-white/60 text-[10px] ml-1">(수정됨)</span>}
          </div>
        )}
        {!editing && isLong && (
          <div className="flex justify-end mt-0.5">
            <button onClick={() => setExpanded(v => !v)} className="text-[11px] font-medium" style={{ color: 'var(--purple)' }}>
              {expanded ? '접기 ↑' : '더 보기 ↓'}
            </button>
          </div>
        )}
        <ReactionBadges />
        <button onClick={() => setShowComments(true)}
          className="flex items-center gap-1 mt-0.5 self-end text-[11px] text-muted hover:text-gray-600 transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          {cardCommentCount > 0 ? `댓글 ${cardCommentCount}` : '댓글'}
        </button>
        <span className="text-[10px] text-muted text-right block mt-0.5">{time}</span>
      </div>
      <CardCommentDrawer messageId={message.id} roomId={message.room_id}
        currentUserId={currentUserId ?? ''} isAdmin={isAdmin}
        isOpen={showComments} onClose={() => setShowComments(false)} onCountChange={setCardCommentCount} />
    </div>
  )

  // ─── 상대방 메시지 ───
  return (
    <div className="flex flex-col px-4 mb-0.5">
      {showContextMenu && <ContextMenu />}
      {selectMode && <SelectCopyModal />}
      <div className="flex items-start gap-1.5">
        {/* 아바타 */}
        <div className="shrink-0 mt-0.5" style={{ width: 32 }}>
          {showSender
            ? <Avatar name={displayName} avatarUrl={sender?.avatar_url} size={32} />
            : <div style={{ width: 32, height: 32 }} />}
        </div>
        {/* 이름+말풍선 */}
        <div className="flex flex-col max-w-[73%]">
          {showSender && (
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-[11px] font-semibold text-gray-700 leading-none">{displayName}</span>
              <span className="text-[10px] text-muted leading-none">{time}</span>
            </div>
          )}
          <div
            className={`px-3 py-2 rounded-2xl rounded-tl-sm ${textClass} text-gray-900 bg-white border border-border leading-relaxed whitespace-pre-wrap`}
            style={{ userSelect: 'none' }}
            onMouseDown={startLongPress} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
            onContextMenu={e => { e.preventDefault(); setShowContextMenu(true) }}>
            {hasQuote && (
              <div className="mb-1.5 pl-2 border-l-2 border-gray-300 text-muted text-xs">
                {quoteLines.join('\n')}
              </div>
            )}
            {renderMessageContent(hasQuote ? bodyLines.join('\n') : displayText)}
            {message.edited && <span className="text-gray-400 text-[10px] ml-1">(수정됨)</span>}
          </div>
          {isLong && (
            <button onClick={() => setExpanded(v => !v)} className="text-[11px] font-medium mt-0.5 self-start" style={{ color: 'var(--purple)' }}>
              {expanded ? '접기 ↑' : '더 보기 ↓'}
            </button>
          )}
          <ReactionBadges />
          <button onClick={() => setShowComments(true)}
            className="flex items-center gap-1 mt-0.5 self-start text-[11px] text-muted hover:text-gray-600 transition-colors">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            {cardCommentCount > 0 ? `댓글 ${cardCommentCount}` : '댓글'}
          </button>
          {!showSender && <span className="text-[10px] text-muted mt-0.5">{time}</span>}
        </div>
      </div>
      <CardCommentDrawer messageId={message.id} roomId={message.room_id}
        currentUserId={currentUserId ?? ''} isAdmin={isAdmin}
        isOpen={showComments} onClose={() => setShowComments(false)} onCountChange={setCardCommentCount} />
    </div>
  )
}
