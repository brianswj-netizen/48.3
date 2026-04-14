'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TAGS = ['전체', '텍스트AI', '이미지AI', '자동화', '부동산×AI'] as const

const TAG_ICONS: Record<string, string> = {
  '텍스트AI': '📄',
  '이미지AI': '🖼️',
  '자동화': '⚙️',
  '부동산×AI': '🏠',
}

type Doc = {
  id: string
  title: string
  url: string
  tag: string | null
  created_at: string
  uploader: { name: string | null; nickname: string | null } | null
}

type Photo = {
  id: string
  url: string
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// 자료 추가 모달
function AddDocModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim() || !url.trim()) { setError('제목과 링크를 입력해주세요.'); return }
    setSaving(true)
    const res = await fetch('/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, tag: tag || null }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? '저장 실패'); return }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] p-5" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-black text-gray-900 mb-4">자료 추가</h2>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="자료 제목" maxLength={100}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500" />
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="링크 (https://...)"
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500" />
          <select value={tag} onChange={e => setTag(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none bg-white">
            <option value="">태그 선택 (선택사항)</option>
            {TAGS.filter(t => t !== '전체').map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-gray-600">취소</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--purple)' }}>
              {saving ? '저장 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DocsClient({ docs, photos }: { docs: Doc[]; photos: Photo[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'docs' | 'photos'>('docs')
  const [activeTag, setActiveTag] = useState<string>('전체')
  const [showAddDoc, setShowAddDoc] = useState(false)

  const filtered = docs.filter(d => activeTag === '전체' || d.tag === activeTag)

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-0 bg-white border-b border-border md:pt-6">
        <h1 className="text-xl font-black text-gray-900 pb-3">자료실</h1>
        <div className="flex">
          {(['docs', 'photos'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === t ? 'border-purple-500 text-purple-600' : 'border-transparent text-muted'
              }`}
              style={activeTab === t ? { borderColor: 'var(--purple)', color: 'var(--purple)' } : {}}>
              {t === 'docs' ? '자료' : '사진첩'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'docs' && (
        <>
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTag === tag ? 'text-white' : 'bg-white text-muted border border-border'
                }`}
                style={activeTag === tag ? { background: 'var(--purple)' } : {}}>
                {tag}
              </button>
            ))}
          </div>

          <div className="px-4 flex flex-col gap-2 pb-24">
            {filtered.length === 0 && (
              <p className="text-sm text-muted text-center py-12">자료가 없습니다.</p>
            )}
            {filtered.map(doc => {
              const uploaderRaw = doc.uploader as any
              const uploader = Array.isArray(uploaderRaw) ? uploaderRaw[0] : uploaderRaw
              const uploaderName = uploader?.name ?? uploader?.nickname ?? ''
              const icon = TAG_ICONS[doc.tag ?? ''] ?? '📄'
              return (
                <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="bg-white rounded-[14px] px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  style={{ border: '0.5px solid var(--border)' }}>
                  <span className="text-2xl shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {uploaderName && `${uploaderName} · `}{formatDate(doc.created_at)}
                    </p>
                  </div>
                  {doc.tag && (
                    <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                      {doc.tag}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'photos' && (
        <div className="px-4 py-4 pb-24">
          {photos.length === 0 ? (
            <p className="text-sm text-muted text-center py-12">사진이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {photos.map(photo => (
                <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                  <img src={photo.url} alt="" className="aspect-square w-full object-cover rounded-lg" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'docs' && (
        <button
          onClick={() => setShowAddDoc(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full text-white text-2xl flex items-center justify-center shadow-lg md:bottom-6"
          style={{ background: 'var(--purple)' }}>
          +
        </button>
      )}

      {showAddDoc && (
        <AddDocModal
          onClose={() => setShowAddDoc(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  )
}
