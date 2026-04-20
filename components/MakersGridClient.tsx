'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Author = { id: string; name: string | null; nickname: string | null; avatar_url: string | null }
type Creature = {
  id: string; title: string; description: string | null; content: string | null
  url: string | null; image_url: string | null; status: string | null; version: string | null
  created_at: string; author: Author | null
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  '기획안':    { color: '#6366F1', bg: '#EEF2FF', label: '기획안' },
  '프로토타입': { color: '#F59E0B', bg: '#FFFBEB', label: '프로토타입' },
  '개발중':    { color: '#10B981', bg: '#ECFDF5', label: '개발중' },
  '테스트중':  { color: '#3B82F6', bg: '#EFF6FF', label: '테스트중' },
  '배포완료':  { color: '#DB2777', bg: '#FDF2F8', label: '배포완료' },
}

const STATUS_LIST = ['기획안', '프로토타입', '개발중', '테스트중', '배포완료']

function getStatus(status: string | null) {
  return STATUS_CONFIG[status ?? '기획안'] ?? STATUS_CONFIG['기획안']
}

// ── 카드 그리드 아이템 ─────────────────────────────────────────
function CreatureCard({ creature, isMine, onClick }: {
  creature: Creature; isMine: boolean; onClick: () => void
}) {
  const st = getStatus(creature.status)
  const authorName = creature.author?.name ?? creature.author?.nickname ?? '알 수 없음'
  const hasImage = !!creature.image_url

  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-2xl overflow-hidden text-left active:scale-95 transition-transform"
      style={{ aspectRatio: '3/4' }}
    >
      {/* 배경 이미지 or 그라디언트 */}
      {hasImage ? (
        <img
          src={creature.image_url!}
          alt={creature.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${st.color}30 0%, ${st.color}10 100%)`,
            borderBottom: `3px solid ${st.color}40`,
          }}
        />
      )}

      {/* 다크 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* 상태 배지 (상단) */}
      <div className="absolute top-2 left-2">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: st.color, color: 'white' }}
        >
          {st.label}{creature.version ? ` ${creature.version}` : ''}
        </span>
      </div>

      {/* 내 카드 표시 */}
      {isMine && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
          <span className="text-[8px]">✏️</span>
        </div>
      )}

      {/* 본문 (하단) */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        {!hasImage && (
          <div className="text-3xl mb-1.5 opacity-60">🛸</div>
        )}
        <p className="text-white font-bold text-xs leading-tight line-clamp-2">{creature.title}</p>
        <p className="text-white/70 text-[10px] mt-0.5 font-medium">{authorName}</p>
        {creature.description && (
          <p className="text-white/50 text-[9px] mt-0.5 line-clamp-2 leading-tight">{creature.description}</p>
        )}
      </div>
    </button>
  )
}

// ── 등록/편집 모달 ─────────────────────────────────────────────
function CreatureModal({
  initial, onClose, onSave,
}: {
  initial?: Partial<Creature>
  onClose: () => void
  onSave: (data: Partial<Creature>) => Promise<void>
}) {
  const isEdit = !!initial?.id
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [status, setStatus] = useState(initial?.status ?? '기획안')
  const [version, setVersion] = useState(initial?.version ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'creatures')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (res.ok) { const { url: u } = await res.json(); setImageUrl(u) }
    else setError('이미지 업로드 실패')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('앱/서비스 이름을 입력해주세요'); return }
    setSubmitting(true); setError('')
    await onSave({ title, description, content, url, status, version: status === '배포완료' ? version : null, image_url: imageUrl })
    setSubmitting(false)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[59] bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '90vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h3 className="font-bold text-gray-900">{isEdit ? '카드 편집' : '새 피조물 등록'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted text-lg rounded-full hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-5 py-4 flex flex-col gap-4">

            {/* 앱 이름 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">앱/서비스 이름 <span className="text-red-400">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="예: 이사만신, CRM-APP"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>

            {/* 한 줄 소개 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">한 줄 소개</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="예: 사주 기반 이사 날짜·동네 추천 서비스"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>

            {/* 상세 설명 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">상세 내용</label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="어떤 문제를 해결하는지, 어떻게 만들었는지, 현재 상태 등을 자유롭게 적어주세요"
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none leading-relaxed"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>

            {/* URL */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">서비스 URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://"
                type="url"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>

            {/* 진행 단계 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">진행 단계</label>
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_LIST.map(s => {
                  const cfg = STATUS_CONFIG[s]
                  const active = status === s
                  return (
                    <button key={s} onClick={() => setStatus(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: active ? cfg.color : cfg.bg,
                        color: active ? 'white' : cfg.color,
                        border: `1.5px solid ${cfg.color}`,
                      }}>
                      {s}
                    </button>
                  )
                })}
              </div>
              {status === '배포완료' && (
                <input value={version} onChange={e => setVersion(e.target.value)}
                  placeholder="버전 입력 (예: v1.0, v2.3)"
                  className="mt-2 w-full px-3.5 py-2 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
              )}
            </div>

            {/* 서비스 이미지 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">서비스 이미지 (카드 배경)</label>
              {imageUrl ? (
                <div className="relative inline-block">
                  <img src={imageUrl} alt="미리보기"
                    className="h-32 w-auto rounded-xl object-cover"
                    style={{ border: '1px solid var(--border)' }} />
                  <button onClick={() => setImageUrl(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">✕</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
                  style={{ border: '1.5px dashed var(--border)', background: '#FAF9F8', color: '#6B7280' }}>
                  {uploading ? '⏳ 업로드 중...' : '🖼️ 이미지 선택'}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button onClick={handleSubmit} disabled={submitting || !title.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-opacity"
              style={{ background: '#DB2777' }}>
              {submitting ? (isEdit ? '저장 중...' : '등록 중...') : (isEdit ? '저장하기' : '등록하기')}
            </button>
            <div className="h-4" />
          </div>
        </div>
      </div>
    </>
  )
}

// ── 메인 그리드 컴포넌트 ────────────────────────────────────────
export default function MakersGridClient({
  creatures: initial,
  currentUserId,
  isAdmin,
}: {
  creatures: Creature[]
  currentUserId: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [creatures, setCreatures] = useState(initial)
  const [showNew, setShowNew] = useState(false)

  async function handleCreate(data: Partial<Creature>) {
    const res = await fetch('/api/creatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const created = await res.json()
      setCreatures(prev => [...prev, created])
    }
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* 2열 vs 3열 비교용 — 현재는 2열 */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-3">
        {creatures.map(c => (
          <CreatureCard
            key={c.id}
            creature={c}
            isMine={c.author?.id === currentUserId}
            onClick={() => router.push(`/makers/${c.id}`)}
          />
        ))}
        {creatures.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">🛸</span>
            <p className="text-sm font-semibold text-gray-700">아직 등록된 피조물이 없어요</p>
            <p className="text-xs text-muted text-center">첫 번째로 만든 앱·도구를 소개해보세요!</p>
          </div>
        )}
      </div>

      {/* + 등록 버튼 */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold text-white z-40 active:scale-95 transition-transform"
        style={{ background: '#DB2777' }}
      >
        +
      </button>

      {showNew && (
        <CreatureModal
          onClose={() => setShowNew(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  )
}
