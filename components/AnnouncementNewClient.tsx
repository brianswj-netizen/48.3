'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from './ImageUpload'

export default function AnnouncementNewClient() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.')
      return
    }

    setSaving(true)
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, image_url: imageUrl }),
    })

    const json = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(json.error ?? '저장에 실패했습니다.')
      return
    }

    router.push('/announcements')
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 bg-white border-b border-border md:pt-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-muted text-2xl leading-none pr-1"
        >
          ‹
        </button>
        <h1 className="text-xl font-black text-gray-900">공지사항 작성</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <section className="bg-white rounded-[14px] p-4 flex flex-col gap-3" style={{ border: '0.5px solid var(--border)' }}>
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="공지사항 제목을 입력하세요"
              maxLength={100}
              className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="공지 내용을 입력하세요..."
              maxLength={2000}
              className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 resize-none h-48 outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-xs text-muted text-right mt-1">{content.length}/2000</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">이미지 첨부</label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} uploadType="announcement" />
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="py-3.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--purple)' }}
        >
          {saving ? '저장 중...' : '공지 등록'}
        </button>
      </form>
    </div>
  )
}
