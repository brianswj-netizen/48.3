'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type PendingUser = {
  id: string
  name: string | null
  nickname: string | null
  avatar_url: string | null
  status: string
  created_at: string
}

type PreMember = {
  id: string
  kakao_id: string
  name: string | null
  major: string | null
  generation: number | null
  birth_year: number | null
  phone: string | null
  company: string | null
  position: string | null
  bio: string | null
}

const MAJOR_LABELS: Record<string, string> = {
  '글프': '글로벌 프롭테크',
  '건개': '부동산 건설개발',
  '경관': '경영·관광',
  '금투': '부동산 금융투자',
}

const BLANK_FORM = { name: '', major: '', generation: '', birth_year: '', phone: '', company: '', position: '', bio: '' }

function PreMembersTab() {
  const [preMembers, setPreMembers] = useState<PreMember[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/pre-members')
      .then(r => r.json())
      .then(d => { setPreMembers(Array.isArray(d) ? d : []); setLoadingList(false) })
      .catch(() => setLoadingList(false))
  }, [])

  async function handleAdd() {
    setError('')
    if (!form.name.trim()) { setError('이름을 입력해주세요.'); return }
    setSaving(true)
    const res = await fetch('/api/admin/pre-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        major: form.major || null,
        generation: form.generation ? Number(form.generation) : null,
        birth_year: form.birth_year ? Number(form.birth_year) : null,
        phone: form.phone || null,
        company: form.company || null,
        position: form.position || null,
        bio: form.bio || null,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (res.ok) {
      setPreMembers(prev => [...prev, json].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')))
      setForm(BLANK_FORM)
      setShowForm(false)
    } else {
      setError(json.error ?? '등록 실패')
    }
  }

  async function handleDelete(id: string, name: string | null) {
    if (!confirm(`${name ?? '이 멤버'}의 사전 프로필을 삭제할까요?`)) return
    setDeleting(id)
    const res = await fetch('/api/admin/pre-members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    if (res.ok) setPreMembers(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">가입 시 이름이 일치하면 프로필이 자동 입력됩니다</p>
        <button
          onClick={() => { setShowForm(v => !v); setError('') }}
          className="text-xs font-bold px-3 py-1.5 rounded-xl text-white"
          style={{ background: 'var(--purple)' }}
        >
          {showForm ? '취소' : '+ 추가'}
        </button>
      </div>

      {showForm && (
        <div className="bg-purple-50 rounded-[14px] p-4 flex flex-col gap-2 border border-purple-100">
          <input placeholder="이름 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="text-sm border border-border rounded-lg px-3 py-2 outline-none" />
          <div className="flex gap-2">
            <select value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))}
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 outline-none bg-white">
              <option value="">전공 선택</option>
              <option value="글프">글로벌 프롭테크</option>
              <option value="건개">부동산 건설개발</option>
              <option value="경관">경영·관광</option>
              <option value="금투">부동산 금융투자</option>
            </select>
            <input placeholder="기수 (예: 46)" value={form.generation} onChange={e => setForm(f => ({ ...f, generation: e.target.value }))}
              className="w-28 text-sm border border-border rounded-lg px-3 py-2 outline-none" type="number" />
          </div>
          <div className="flex gap-2">
            <input placeholder="출생연도 (예: 1985)" value={form.birth_year} onChange={e => setForm(f => ({ ...f, birth_year: e.target.value }))}
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 outline-none" type="number" />
            <input placeholder="연락처" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 outline-none" />
          </div>
          <input placeholder="직장명" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            className="text-sm border border-border rounded-lg px-3 py-2 outline-none" />
          <input placeholder="직급 (예: 과장, 대표)" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
            className="text-sm border border-border rounded-lg px-3 py-2 outline-none" />
          <input placeholder="소개 (임원직함·업무분야 등)" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            className="text-sm border border-border rounded-lg px-3 py-2 outline-none" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleAdd} disabled={saving}
            className="py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--purple)' }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}

      {loadingList ? (
        <p className="text-sm text-muted text-center py-6">불러오는 중...</p>
      ) : preMembers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm text-muted">사전 등록된 프로필이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {preMembers.map(m => (
            <div key={m.id} className="bg-white rounded-[14px] px-4 py-3 flex items-center gap-3"
              style={{ border: '0.5px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                {(m.name ?? '?').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{m.name}</p>
                <p className="text-xs text-muted mt-0.5">
                  {[m.generation ? `${m.generation}기` : null, m.major ? MAJOR_LABELS[m.major] ?? m.major : null, m.company].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button onClick={() => handleDelete(m.id, m.name)} disabled={deleting === m.id}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 disabled:opacity-40">
                {deleting === m.id ? '...' : '삭제'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminClient({ pendingUsers: initial }: { pendingUsers: PendingUser[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [tab, setTab] = useState<'approve' | 'pre'>('approve')

  async function handleApprove(id: string) {
    const user = users.find(u => u.id === id)
    const name = user?.name ?? user?.nickname ?? '이 멤버'
    if (!confirm(`${name}님의 가입을 승인할까요?`)) return
    setLoading(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    })
    setLoading(null)
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
      router.refresh()
    }
  }

  async function handleReject(id: string) {
    if (!confirm('이 가입 요청을 거절할까요?')) return
    setLoading(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    })
    setLoading(null)
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
      router.refresh()
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 bg-white border-b border-border md:pt-6">
        <h1 className="text-xl font-black text-gray-900">관리자</h1>
      </header>

      {/* 탭 */}
      <div className="flex border-b border-border bg-white px-5">
        <button
          onClick={() => setTab('approve')}
          className={`py-3 text-sm font-semibold mr-4 border-b-2 transition-colors ${tab === 'approve' ? 'border-purple-500 text-purple-600' : 'border-transparent text-muted'}`}
        >
          가입 승인
          {users.length > 0 && (
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#EF4444' }}>
              {users.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('pre')}
          className={`py-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'pre' ? 'border-purple-500 text-purple-600' : 'border-transparent text-muted'}`}
        >
          사전 프로필
        </button>
      </div>

      <div className="px-4 py-4">
        {tab === 'approve' ? (
          <div className="flex flex-col gap-2">
            {users.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-sm font-semibold text-gray-700">대기 중인 멤버가 없어요</p>
                <p className="text-xs text-muted mt-1">모든 가입 요청이 처리되었습니다.</p>
              </div>
            ) : (
              users.map((u) => {
                const displayName = u.name ?? u.nickname ?? '이름 미입력'
                const isLoading = loading === u.id
                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-[14px] px-4 py-4 flex items-center gap-3"
                    style={{ border: '0.5px solid var(--border)' }}
                  >
                    <div
                      className="w-11 h-11 rounded-full shrink-0 bg-cover bg-center flex items-center justify-center text-lg"
                      style={{
                        backgroundImage: u.avatar_url ? `url(${u.avatar_url})` : undefined,
                        background: u.avatar_url ? undefined : 'var(--purple-light)',
                      }}
                    >
                      {!u.avatar_url && '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{displayName}</p>
                      <p className="text-xs text-muted mt-0.5">{formatDate(u.created_at)}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ background: 'var(--teal)' }}
                      >
                        {isLoading ? '...' : '승인'}
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ background: 'var(--coral)' }}
                      >
                        거절
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <PreMembersTab />
        )}
      </div>
    </div>
  )
}
