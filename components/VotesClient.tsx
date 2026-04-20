'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type VoteOption = {
  id: string
  text: string
  votes: number
}

type Vote = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  vote_options: VoteOption[]
  my_option_id: string | null
  participant_count: number
}

function dday(deadline: string | null) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return '마감'
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
}

function isExpired(deadline: string | null) {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

// 어드민 투표 생성 모달
function CreateVoteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addOption() { setOptions(o => [...o, '']) }
  function updateOption(i: number, val: string) {
    setOptions(o => o.map((v, idx) => idx === i ? val : v))
  }
  function removeOption(i: number) {
    if (options.length <= 2) return
    setOptions(o => o.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const validOptions = options.filter(o => o.trim())
    if (!title.trim() || validOptions.length < 2) {
      setError('제목과 선택지를 2개 이상 입력해주세요.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, deadline: deadline || null, options: validOptions }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? '저장 실패'); return }
    onSaved()
    onClose()
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }} onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] flex flex-col"
        style={{ maxHeight: '80dvh' }}
        onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-base font-black text-gray-900">투표 만들기</h2>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 flex flex-col gap-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="투표 제목" maxLength={100}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500" />
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="설명 (선택사항)" maxLength={300}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 resize-none h-20" />
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">마감일 (선택사항)</label>
            <input type="date" value={deadline} min={todayStr} onChange={e => setDeadline(e.target.value)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">선택지</label>
            <div className="flex flex-col gap-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)}
                    placeholder={`선택지 ${i + 1}`} maxLength={100}
                    className="flex-1 text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500" />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="text-muted text-xl px-2">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption}
                className="text-xs font-medium py-2 rounded-xl border border-dashed border-border text-muted hover:bg-gray-50">
                + 선택지 추가
              </button>
            </div>
          </div>
        </div>

        {/* 고정 버튼 영역 */}
        <div className="px-5 pb-6 pt-3 border-t border-border shrink-0 flex gap-2"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border text-gray-600">취소</button>
          <button type="button" onClick={e => handleSubmit(e as unknown as React.FormEvent)} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--purple)' }}>
            {saving ? '저장 중...' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VotesClient({ votes: initialVotes, isAdmin }: { votes: Vote[]; isAdmin: boolean }) {
  const router = useRouter()
  const [votes, setVotes] = useState(initialVotes)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [voting, setVoting] = useState<string | null>(null)

  async function handleDeleteVote(voteId: string) {
    if (!confirm('투표를 삭제할까요?')) return
    const res = await fetch(`/api/votes/${voteId}`, { method: 'DELETE' })
    if (res.ok) {
      setVotes(prev => prev.filter(v => v.id !== voteId))
      router.refresh()
    } else {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? '삭제에 실패했습니다.')
    }
  }

  async function handleVote(voteId: string, optionId: string) {
    setVoting(optionId)
    const res = await fetch(`/api/votes/${voteId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option_id: optionId }),
    })
    setVoting(null)
    if (!res.ok) return

    // 낙관적 업데이트
    setVotes(prev => prev.map(v => {
      if (v.id !== voteId) return v
      const prevOptionId = v.my_option_id
      const updatedOptions = v.vote_options.map(o => ({
        ...o,
        votes: o.id === optionId
          ? o.votes + 1
          : o.id === prevOptionId
          ? Math.max(0, o.votes - 1)
          : o.votes,
      }))
      return {
        ...v,
        my_option_id: optionId,
        participant_count: prevOptionId ? v.participant_count : v.participant_count + 1,
        vote_options: updatedOptions,
      }
    }))
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#2858A8' }}>
        <h1 className="text-xl font-black text-white">투표</h1>
      </header>

      <div className="px-4 py-4 flex flex-col gap-3 pb-24">
        {votes.length === 0 && (
          <p className="text-sm text-muted text-center py-12">진행 중인 투표가 없습니다.</p>
        )}
        {votes.map(vote => {
          const isOpen = expanded === vote.id
          const total = vote.vote_options.reduce((s, o) => s + o.votes, 0)
          const expired = isExpired(vote.deadline)
          const ddayStr = dday(vote.deadline)
          const hasVoted = !!vote.my_option_id

          return (
            <div key={vote.id} className="bg-white rounded-[14px] overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
              <div className="flex items-start">
              <button
                onClick={() => setExpanded(isOpen ? null : vote.id)}
                className="flex-1 px-4 py-4 flex items-center gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{vote.title}</p>
                  <p className="text-xs text-muted mt-0.5">참여 {vote.participant_count}명</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasVoted && !expired && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--teal-light)', color: 'var(--teal)' }}>참여완료</span>
                  )}
                  {ddayStr && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={expired
                        ? { background: '#F3F4F6', color: '#6B7280' }
                        : { background: 'var(--coral-light)', color: 'var(--coral)' }}>
                      {ddayStr}
                    </span>
                  )}
                  <span className="text-muted">{isOpen ? '∧' : '∨'}</span>
                </div>
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDeleteVote(vote.id)}
                  className="shrink-0 px-3 py-4 text-red-300 hover:text-red-500 text-sm"
                  title="투표 삭제">
                  🗑
                </button>
              )}
              </div>

              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  {vote.description && (
                    <p className="text-xs text-muted mb-2 leading-relaxed">{vote.description}</p>
                  )}
                  {vote.vote_options.map(opt => {
                    const pct = total ? Math.round((opt.votes / total) * 100) : 0
                    const isMyVote = vote.my_option_id === opt.id

                    return (
                      <button
                        key={opt.id}
                        onClick={() => !expired && handleVote(vote.id, opt.id)}
                        disabled={expired || voting === opt.id}
                        className={`w-full text-left rounded-xl border transition-colors ${
                          isMyVote ? 'border-purple-500' : 'border-border'
                        } ${expired ? 'cursor-default' : 'hover:bg-gray-50'}`}
                        style={isMyVote ? { borderColor: 'var(--purple)' } : {}}
                      >
                        <div className="px-3 pt-2.5 pb-1">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className={`font-medium ${isMyVote ? 'text-purple-600' : 'text-gray-800'}`}
                              style={isMyVote ? { color: 'var(--purple)' } : {}}>
                              {isMyVote && '✓ '}{opt.text}
                            </span>
                            <span className="text-muted">{pct}% ({opt.votes})</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: isMyVote ? 'var(--purple)' : 'var(--border)' }} />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                  {!expired && !hasVoted && (
                    <p className="text-xs text-muted text-center mt-1">선택지를 눌러 투표하세요</p>
                  )}
                  {expired && (
                    <p className="text-xs text-muted text-center mt-1">마감된 투표입니다</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isAdmin && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full text-white text-2xl flex items-center justify-center shadow-lg md:bottom-6"
          style={{ background: 'var(--purple)' }}>
          +
        </button>
      )}

      {showCreate && (
        <CreateVoteModal
          onClose={() => setShowCreate(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  )
}
