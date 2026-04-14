'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function SetupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const kakaoNickname = session?.user?.name ?? ''
  const [name, setName] = useState(kakaoNickname)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '오류가 발생했습니다.')
        return
      }

      router.replace('/')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 닉네임과 입력값이 다른지 여부
  const isNicknameChanged = name.trim() !== kakaoNickname.trim()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--navy)' }}>

      {/* 로고 */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--purple)' }}>
          <span className="text-3xl">⚓</span>
        </div>
        <h1 className="text-white text-xl font-black">AI Survival Crew</h1>
      </div>

      {/* 카드 */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-gray-900 mb-1">
          반갑습니다! 👋
        </h2>

        {/* 닉네임과 입력값에 따라 안내 문구 변경 */}
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {isNicknameChanged
            ? <>카카오 닉네임 대신 <strong>실명</strong>을 입력해주셨군요!<br />이 이름으로 크루에 등록할게요.</>
            : <>카카오 닉네임이 실명과 같다면 그대로 확인을,<br />다르다면 <strong>실명</strong>으로 수정해주세요.</>
          }
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              실명
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              maxLength={10}
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-purple-500"
              style={{ borderColor: 'var(--border)' }}
              autoFocus
            />
            {error && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--coral)' }}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--purple)' }}
          >
            {loading ? '저장 중...' : isNicknameChanged ? '크루 합류하기' : '이 이름으로 합류하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
