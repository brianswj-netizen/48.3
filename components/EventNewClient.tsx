'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from './ImageUpload'

export default function EventNewClient() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')
  const [notes, setNotes] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !eventDate) {
      setError('제목과 날짜는 필수입니다.')
      return
    }

    setSaving(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        place: place || null,
        notes: notes || null,
        event_date: eventDate,
        event_time: eventTime || null,
        image_url: imageUrl,
      }),
    })

    const json = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(json.error ?? '저장에 실패했습니다.')
      return
    }

    router.push('/calendar')
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
        <h1 className="text-xl font-black text-gray-900">일정 추가</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <section className="bg-white rounded-[14px] p-4 flex flex-col gap-4" style={{ border: '0.5px solid var(--border)' }}>
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">일정 이름 *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 5월 정기모임"
              maxLength={100}
              className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted mb-1.5 block">날짜 *</label>
              <input
                type="date"
                value={eventDate}
                min={todayStr}
                onChange={e => setEventDate(e.target.value)}
                className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="w-32">
              <label className="text-xs font-semibold text-muted mb-1.5 block">시간</label>
              <input
                type="time"
                value={eventTime}
                onChange={e => setEventTime(e.target.value)}
                className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">장소</label>
            <input
              type="text"
              value={place}
              onChange={e => setPlace(e.target.value)}
              placeholder="예: 건국대 부동산대학원 세미나실"
              maxLength={200}
              className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">기타 사항</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="준비물, 복장, 참고사항 등 자유롭게 입력하세요."
              maxLength={500}
              rows={3}
              className="w-full text-sm text-gray-800 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">이미지 첨부</label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} uploadType="event" />
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="py-3.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--purple)' }}
        >
          {saving ? '저장 중...' : '일정 등록'}
        </button>
      </form>
    </div>
  )
}
