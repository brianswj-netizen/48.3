'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PendingUser = {
  id: string
  name: string | null
  nickname: string | null
  avatar_url: string | null
  status: string
  created_at: string
}

export default function AdminClient({ pendingUsers: initial }: { pendingUsers: PendingUser[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

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
        <h1 className="text-xl font-black text-gray-900">멤버 승인</h1>
        <p className="text-xs text-muted mt-0.5">가입 대기 중인 멤버를 승인하세요</p>
      </header>

      <div className="px-4 py-4 flex flex-col gap-2">
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
                {/* 아바타 */}
                <div
                  className="w-11 h-11 rounded-full shrink-0 bg-cover bg-center flex items-center justify-center text-lg"
                  style={{
                    backgroundImage: u.avatar_url ? `url(${u.avatar_url})` : undefined,
                    background: u.avatar_url ? undefined : 'var(--purple-light)',
                  }}
                >
                  {!u.avatar_url && '👤'}
                </div>

                {/* 이름 + 가입 시간 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{displayName}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDate(u.created_at)}</p>
                </div>

                {/* 버튼 */}
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
    </div>
  )
}
