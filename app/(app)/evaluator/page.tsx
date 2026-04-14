'use client'
import { useState, useRef } from 'react'
import { aiLevels } from '@/lib/data'

export default function EvaluatorPage() {
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, level: selectedLevel }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }])
    } finally {
      setLoading(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="px-5 pt-12 pb-4 bg-white border-b border-border md:pt-6 shrink-0">
        <h1 className="text-xl font-bold text-gray-900">🤖 AI 평가관</h1>
        <p className="text-xs text-muted mt-1">AI 결과물을 공유하면 레벨을 평가해드립니다</p>
      </header>

      {/* 레벨 선택 */}
      <div className="px-4 py-3 bg-white border-b border-border shrink-0">
        <p className="text-xs font-semibold text-muted mb-2">현재 레벨 선택</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {aiLevels.map((l) => (
            <button
              key={l.level}
              onClick={() => setSelectedLevel(l.level)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                selectedLevel === l.level
                  ? 'border-purple bg-purple text-white'
                  : 'border-border text-muted'
              }`}
            >
              {l.emoji} {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-sm font-semibold text-gray-800">AI 결과물을 평가해드립니다</p>
            <p className="text-xs text-muted mt-1">ChatGPT 사용 결과, 자동화 워크플로우, 이미지 생성 등<br />어떤 것이든 공유해보세요!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm border border-border'
              }`}
              style={msg.role === 'user' ? { background: 'var(--purple)' } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-muted">
              평가 중...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 입력창 */}
      <div
        className="px-4 py-3 bg-white border-t border-border shrink-0 flex gap-2 items-end"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="AI 결과물을 설명하거나 붙여넣어 보세요..."
          className="flex-1 text-sm border border-border rounded-xl px-3 py-2 resize-none outline-none focus:border-purple h-10 max-h-32"
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
          style={{ background: 'var(--purple)' }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
