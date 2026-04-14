'use client'

import { useState, useRef } from 'react'

export type MemberOption = { id: string; name: string | null; nickname: string | null }

type Props = {
  onSend: (text: string) => Promise<void>
  placeholder?: string
  members?: MemberOption[]
  disabled?: boolean
}

export default function MentionCommentInput({
  onSend,
  placeholder = '의견을 남겨주세요... (@이름으로 멘션)',
  members = [],
  disabled = false,
}: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending || disabled) return
    setSending(true)
    setText('')
    setMentionQuery(null)
    try { await onSend(trimmed) }
    finally { setSending(false); inputRef.current?.focus() }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setText(value)

    // @멘션 감지
    const cursor = e.target.selectionStart ?? value.length
    const before = value.slice(0, cursor)
    const match = before.match(/@([^\s@]*)$/)
    if (match) {
      setMentionQuery(match[1])
      setMentionStart(cursor - match[0].length)
    } else {
      setMentionQuery(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleSend() }
    if (e.key === 'Escape') setMentionQuery(null)
  }

  function insertMention(member: MemberOption) {
    const displayName = member.name ?? member.nickname ?? ''
    const cursor = inputRef.current?.selectionStart ?? text.length
    const after = text.slice(cursor)
    const newText = text.slice(0, mentionStart) + '@' + displayName + ' ' + after
    setText(newText)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const pos = mentionStart + displayName.length + 2
        inputRef.current.selectionStart = inputRef.current.selectionEnd = pos
        inputRef.current.focus()
      }
    })
  }

  const mentionList = mentionQuery !== null && members.length > 0
    ? members.filter(m => {
        const q = mentionQuery.toLowerCase()
        const name = (m.name ?? '').toLowerCase()
        const nick = (m.nickname ?? '').toLowerCase()
        return name.includes(q) || nick.includes(q)
      }).slice(0, 6)
    : []

  return (
    <div className="relative flex flex-col gap-1.5">
      {/* @멘션 자동완성 드롭다운 (위로 열림) */}
      {mentionList.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-20">
          {mentionList.map(m => {
            const displayName = m.name ?? m.nickname ?? '?'
            return (
              <button
                key={m.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); insertMention(m) }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: 'var(--purple)' }}
                >
                  {displayName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-900">@{displayName}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={300}
          className="flex-1 text-xs border border-border rounded-xl px-3 py-2 outline-none focus:border-purple-400 bg-gray-50 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="text-xs font-semibold px-3 py-2 rounded-xl text-white disabled:opacity-40 shrink-0 transition-opacity"
          style={{ background: 'var(--purple)' }}
        >
          {sending ? '...' : '등록'}
        </button>
      </div>
    </div>
  )
}
