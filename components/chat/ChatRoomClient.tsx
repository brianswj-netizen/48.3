'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MessageItem, { type ReactionData } from './MessageItem'
import MessageInput from './MessageInput'
import type { Message } from '@/lib/types'

type MemberOption = { id: string; name: string | null; nickname: string | null }

type Props = {
  roomId: string
  roomName: string
  initialMessages: Message[]
  currentUserId: string
  isAdmin?: boolean
  members?: MemberOption[]
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted shrink-0">{date}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function formatDateLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getDate() - d.getDate()
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ChatRoomClient({ roomId, roomName, initialMessages, currentUserId, isAdmin, members = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')
  const [reactionsMap, setReactionsMap] = useState<Record<string, ReactionData[]>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('chatFontSize') as 'normal' | 'large' | null
    if (saved) setFontSize(saved)
  }, [])

  // 이모티콘 반응 초기 로드
  useEffect(() => {
    fetch(`/api/chat/${roomId}/reactions`)
      .then(r => r.json())
      .then(data => { if (data && typeof data === 'object') setReactionsMap(data) })
      .catch(() => {})
  }, [roomId])

  function toggleFontSize() {
    const next = fontSize === 'normal' ? 'large' : 'normal'
    setFontSize(next)
    localStorage.setItem('chatFontSize', next)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const newId = payload.new.id
          setMessages(prev => { if (prev.find(m => m.id === newId)) return prev; return prev })
          const res = await fetch(`/api/chat/${roomId}/messages`)
          const data = await res.json()
          if (Array.isArray(data)) setMessages(data)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase])

  async function handleSend(text: string) {
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      room_id: roomId,
      sender_id: currentUserId,
      text,
      edited: false,
      deleted: false,
      created_at: new Date().toISOString(),
      sender: null,
    }
    setMessages(prev => [...prev, tempMessage])
    await fetch(`/api/chat/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  }

  function handleDeleteMessage(id: string) {
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  function handleEditMessage(id: string, newText: string) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text: newText, edited: true } : m))
  }

  async function handleReaction(messageId: string, emoji: string) {
    // 낙관적 업데이트
    setReactionsMap(prev => {
      const list = [...(prev[messageId] ?? [])]
      const idx = list.findIndex(r => r.emoji === emoji)
      if (idx >= 0) {
        const r = list[idx]
        if (r.mine) {
          const newCount = r.count - 1
          if (newCount === 0) list.splice(idx, 1)
          else list[idx] = { ...r, count: newCount, mine: false }
        } else {
          list[idx] = { ...r, count: r.count + 1, mine: true }
        }
      } else {
        list.push({ emoji, count: 1, mine: true })
      }
      return { ...prev, [messageId]: list }
    })
    // API 호출
    await fetch(`/api/chat/${roomId}/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
  }

  let lastDate = ''
  let lastSenderId = ''

  return (
    <div className="flex flex-col h-full">
      {/* 글씨 크기 토글 */}
      <div className="flex justify-end px-4 py-1.5 border-b border-border bg-white">
        <button
          onClick={toggleFontSize}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
          style={fontSize === 'large'
            ? { background: 'var(--purple)', color: 'white' }
            : { background: '#F3F4F6', color: '#6B7280' }}>
          <span style={{ fontSize: fontSize === 'large' ? 13 : 11 }}>가</span>
          <span style={{ fontSize: fontSize === 'large' ? 11 : 13 }}>가</span>
          {fontSize === 'large' ? ' 크게' : ' 기본'}
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-sm font-semibold text-gray-700">{roomName} 채팅방</p>
            <p className="text-xs text-muted mt-1">첫 번째 메시지를 보내보세요!</p>
          </div>
        )}

        {messages.map((msg) => {
          const msgDate = new Date(msg.created_at).toDateString()
          const showDivider = msgDate !== lastDate
          const isMine = msg.sender_id === currentUserId
          const showSender = !isMine && (msg.sender_id !== lastSenderId || showDivider)
          lastDate = msgDate
          lastSenderId = msg.sender_id

          return (
            <div key={msg.id}>
              {showDivider && <DateDivider date={formatDateLabel(msg.created_at)} />}
              <MessageItem
                message={msg}
                isMine={isMine}
                showSender={showSender}
                isAdmin={isAdmin}
                fontSize={fontSize}
                reactions={reactionsMap[msg.id] ?? []}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
                onReaction={(emoji) => handleReaction(msg.id, emoji)}
              />
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput roomId={roomId} onSend={handleSend} members={members} />
    </div>
  )
}
