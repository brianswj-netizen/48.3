'use client'

import { useState, useEffect, useRef } from 'react'

type Comment = {
  id: string
  text: string
  created_at: string
  user: { id: string; name: string | null; nickname: string | null; avatar_url?: string | null } | null
}

type Props = {
  messageId: string
  roomId: string
  currentUserId: string
  isAdmin?: boolean
  isOpen: boolean
  onClose: () => void
  onCountChange?: (count: number) => void
}

function formatCommentTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return '방금'
  if (diff < 3_600_000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86_400_000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function CardCommentDrawer({
  messageId, roomId, currentUserId, isAdmin, isOpen, onClose, onCountChange,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/chat/${roomId}/messages/${messageId}/comments`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setComments(data)
          onCountChange?.(data.length)
        }
      })
      .finally(() => setLoading(false))
  }, [isOpen, messageId, roomId])

  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [comments.length])

  async function handleSubmit() {
    if (!text.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/chat/${roomId}/messages/${messageId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() }),
    })
    if (res.ok) {
      const newComment = await res.json()
      setComments(prev => {
        const next = [...prev, newComment]
        onCountChange?.(next.length)
        return next
      })
      setText('')
    }
    setSending(false)
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(
      `/api/chat/${roomId}/messages/${messageId}/comments?id=${commentId}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      setComments(prev => {
        const next = prev.filter(c => c.id !== commentId)
        onCountChange?.(next.length)
        return next
      })
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '72vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h3 className="font-bold text-sm text-gray-900">
            댓글{comments.length > 0 ? ` ${comments.length}` : ''}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted text-lg rounded-full hover:bg-gray-100"
          >✕</button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 min-h-0">
          {loading ? (
            <p className="text-center text-sm text-muted py-10">불러오는 중...</p>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-3xl">💬</span>
              <p className="text-sm text-muted">첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            comments.map(c => {
              const name = c.user?.name ?? c.user?.nickname ?? '알 수 없음'
              const isMine = c.user?.id === currentUserId
              return (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                    style={{ background: 'var(--purple)' }}
                  >
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-900">{name}</span>
                      <span className="text-[10px] text-muted">{formatCommentTime(c.created_at)}</span>
                      {(isMine || isAdmin) && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-[10px] text-red-300 hover:text-red-500 ml-auto"
                        >삭제</button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{c.text}</p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-2 shrink-0">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
            }}
            placeholder="댓글을 입력하세요..."
            className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm outline-none"
            style={{ border: '1px solid var(--border)' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || sending}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--purple)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
