'use client'

import { useState, useRef } from 'react'

// 작가(Olivia Herrick) 컬러 팔레트 기반 그룹 이모지 피커
const EMOJI_GROUPS = [
  {
    label: '표정',
    bg: 'rgba(224, 123, 84, 0.10)',    // coral
    emojis: ['😊','😂','🥰','😍','🤔','😅','😭','😤','🙏'],
  },
  {
    label: '행동',
    bg: 'rgba(40, 128, 160, 0.10)',    // teal-blue
    emojis: ['👍','👎','🔥','❤️','💯','✅','🎉','⭐','💪'],
  },
  {
    label: '기타',
    bg: 'rgba(123, 111, 196, 0.10)',   // purple
    emojis: ['👏','🤝','😎','🤩','😬','🥲','😮','🤦','🙌'],
  },
  {
    label: '심볼',
    bg: 'rgba(196, 144, 48, 0.10)',    // gold/amber
    emojis: ['💡','📌','🚀','⚡','📢','🎯','💬','❓','‼️'],
  },
]

type MemberOption = { id: string; name: string | null; nickname: string | null }

type ReplyTarget = {
  senderName: string
  text: string
}

type Props = {
  roomId: string
  onSend: (text: string) => Promise<void>
  members?: MemberOption[]
  replyTo?: ReplyTarget | null
  onCancelReply?: () => void
}

export default function MessageInput({ onSend, members = [], replyTo, onCancelReply }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSend() {
    const trimmed = text.trim()
    const hasImage = !!imageUrl
    if (!trimmed && !hasImage || sending) return
    setSending(true)

    // 답장 prefix 붙이기
    let body = trimmed
    if (replyTo) {
      const quoteLine = `> ${replyTo.senderName}: ${replyTo.text.split('\n')[0].slice(0, 80)}`
      body = body ? `${quoteLine}\n\n${body}` : quoteLine
      onCancelReply?.()
    }

    const messageText = hasImage
      ? (body ? `${body}\n__IMAGE__:${imageUrl}` : `__IMAGE__:${imageUrl}`)
      : body
    setText('')
    setImageUrl(null)
    setShowEmoji(false)
    setMentionQuery(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    try { await onSend(messageText) }
    finally { setSending(false); textareaRef.current?.focus() }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === 'Escape') setMentionQuery(null)
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setText(value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'

    // @멘션 감지
    const cursor = el.selectionStart ?? value.length
    const before = value.slice(0, cursor)
    const match = before.match(/@([^\s@]*)$/)
    if (match) {
      setMentionQuery(match[1])
      setMentionStart(cursor - match[0].length)
    } else {
      setMentionQuery(null)
    }
  }

  function insertMention(member: MemberOption) {
    const displayName = member.name ?? member.nickname ?? ''
    const cursor = textareaRef.current?.selectionStart ?? text.length
    const after = text.slice(cursor)
    const newText = text.slice(0, mentionStart) + '@' + displayName + ' ' + after
    setText(newText)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = mentionStart + displayName.length + 2
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos
        textareaRef.current.focus()
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
      }
    })
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'chat')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setImageUrl(url)
    }
    setUploading(false)
    // reset
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function insertEmoji(emoji: string) {
    const ta = textareaRef.current
    if (ta) {
      const start = ta.selectionStart ?? text.length
      const end = ta.selectionEnd ?? text.length
      const newText = text.slice(0, start) + emoji + text.slice(end)
      setText(newText)
      requestAnimationFrame(() => {
        ta.focus()
        ta.selectionStart = ta.selectionEnd = start + emoji.length
      })
    } else {
      setText(t => t + emoji)
    }
  }

  // 멘션 자동완성 목록
  const mentionList = mentionQuery !== null && members.length > 0
    ? members.filter(m => {
        const q = mentionQuery.toLowerCase()
        const name = (m.name ?? '').toLowerCase()
        const nick = (m.nickname ?? '').toLowerCase()
        return name.includes(q) || nick.includes(q)
      }).slice(0, 5)
    : []

  return (
    <div className="border-t border-border bg-white px-3 pt-2 pb-1.5">
      {/* 답장 배너 */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: '#F3F4F6', borderLeft: '3px solid var(--purple)' }}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold truncate" style={{ color: 'var(--purple)' }}>
              {replyTo.senderName}에게 답장
            </p>
            <p className="text-xs text-muted truncate">{replyTo.text.split('\n')[0].slice(0, 60)}</p>
          </div>
          <button onClick={onCancelReply} className="text-muted text-sm shrink-0 p-0.5">✕</button>
        </div>
      )}

      {/* @멘션 자동완성 드롭다운 */}
      {mentionList.length > 0 && (
        <div className="mb-2 bg-white border border-border rounded-xl shadow-md overflow-hidden">
          {mentionList.map(m => {
            const displayName = m.name ?? m.nickname ?? '?'
            return (
              <button
                key={m.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); insertMention(m) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: 'var(--purple)' }}>
                  {displayName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-900">@{displayName}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 이모지 피커 */}
      {showEmoji && (
        <div className="mb-2 rounded-xl border border-border overflow-hidden">
          {EMOJI_GROUPS.map(group => (
            <div key={group.label} className="grid grid-cols-9" style={{ background: group.bg }}>
              {group.emojis.map(e => (
                <button key={e} type="button" onClick={() => insertEmoji(e)}
                  className="w-full aspect-square flex items-center justify-center text-xl hover:bg-white/60 transition-colors">
                  {e}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 이미지 미리보기 */}
      {imageUrl && (
        <div className="mb-2 relative inline-block">
          <img src={imageUrl} alt="첨부 이미지" className="h-20 w-auto rounded-xl object-cover" style={{ border: '1px solid var(--border)' }} />
          <button onClick={() => setImageUrl(null)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">
            ✕
          </button>
        </div>
      )}
      <div className="flex items-end gap-1.5">
        <button type="button" onClick={() => setShowEmoji(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-xl shrink-0 transition-colors"
          style={{ color: showEmoji ? 'var(--purple)' : '#9CA3AF' }}
          aria-label="이모지">
          😊
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-9 h-9 flex items-center justify-center rounded-full text-lg shrink-0 transition-colors disabled:opacity-40"
          style={{ color: imageUrl ? 'var(--purple)' : '#9CA3AF' }}
          aria-label="이미지 첨부">
          {uploading ? '⏳' : '🖼️'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
          className="flex-1 resize-none text-sm text-gray-900 placeholder:text-muted outline-none bg-gray-50 rounded-2xl px-4 py-2.5 leading-relaxed"
          style={{ maxHeight: 120, minHeight: 40 }}
        />
        <button onClick={handleSend} disabled={(!text.trim() && !imageUrl) || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30"
          style={{ background: 'var(--purple)' }}>
          <SendIcon />
        </button>
      </div>
      <p className="text-[10px] text-muted text-right pr-1 mt-1">Shift+Enter로 줄바꿈 · @이름으로 멘션</p>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
