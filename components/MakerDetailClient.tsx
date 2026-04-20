'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Author = { id: string; name: string | null; nickname: string | null; avatar_url?: string | null }
type Creature = {
  id: string; title: string; description: string | null; content: string | null
  url: string | null; image_url: string | null; status: string | null; version: string | null
  created_at: string; author: Author | null
}
type Feedback = {
  id: string; feedback_type: 'claude' | 'peer'; content: string; created_at: string
  author: { id: string; name: string | null; nickname: string | null } | null
}
type SapjilPost = {
  id: string; title: string; content: string; image_url: string | null; created_at: string
  reactions?: { emoji: string; count: number; userIds: string[] }[]
}
type SapjilComment = {
  id: string; text: string; created_at: string
  user: { id: string; name: string | null; nickname: string | null } | null
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  '기획안':    { color: '#6366F1', bg: '#EEF2FF' },
  '프로토타입': { color: '#F59E0B', bg: '#FFFBEB' },
  '개발중':    { color: '#10B981', bg: '#ECFDF5' },
  '테스트중':  { color: '#3B82F6', bg: '#EFF6FF' },
  '배포완료':  { color: '#DB2777', bg: '#FDF2F8' },
}
const STATUS_LIST = ['기획안', '프로토타입', '개발중', '테스트중', '배포완료']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso), diff = Date.now() - d.getTime()
  if (diff < 60_000) return '방금'
  if (diff < 3_600_000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86_400_000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// ── 진행 단계 스텝퍼 ────────────────────────────────────────────
function StatusStepper({ status }: { status: string | null }) {
  const current = STATUS_LIST.indexOf(status ?? '기획안')
  return (
    <div className="flex items-center w-full">
      {STATUS_LIST.map((s, i) => {
        const cfg = STATUS_CONFIG[s]
        const reached = i <= current
        const isCurrent = i === current
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: reached ? cfg.color : '#E5E7EB',
                  boxShadow: isCurrent ? `0 0 0 3px ${cfg.color}30` : 'none',
                }}
              >
                {reached && <span className="text-white text-[8px] font-black">✓</span>}
              </div>
              <span className="text-[8px] mt-0.5 font-semibold text-center whitespace-nowrap"
                style={{ color: reached ? cfg.color : '#9CA3AF', lineHeight: 1.2 }}>
                {s === '프로토타입' ? '프로토' : s}
              </span>
            </div>
            {i < STATUS_LIST.length - 1 && (
              <div className="flex-1 h-0.5 -mt-3 mx-0.5 transition-all"
                style={{ background: i < current ? STATUS_CONFIG[STATUS_LIST[i + 1]].color + '60' : '#E5E7EB' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── 편집 모달 ────────────────────────────────────────────────────
function EditModal({ creature, onClose, onSaved }: {
  creature: Creature; onClose: () => void; onSaved: (updated: Creature) => void
}) {
  const [title, setTitle] = useState(creature.title)
  const [description, setDescription] = useState(creature.description ?? '')
  const [content, setContent] = useState(creature.content ?? '')
  const [url, setUrl] = useState(creature.url ?? '')
  const [status, setStatus] = useState(creature.status ?? '기획안')
  const [version, setVersion] = useState(creature.version ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(creature.image_url)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'creatures')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (res.ok) { const { url: u } = await res.json(); setImageUrl(u) }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSave() {
    if (!title.trim()) { setError('이름을 입력해주세요'); return }
    setSubmitting(true); setError('')
    const res = await fetch(`/api/creatures/${creature.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(), description: description.trim() || null,
        content: content.trim() || null, url: url.trim() || null,
        image_url: imageUrl, status,
        version: status === '배포완료' ? version.trim() || null : null,
      }),
    })
    if (res.ok) {
      onSaved({ ...creature, title: title.trim(), description: description.trim() || null, content: content.trim() || null, url: url.trim() || null, image_url: imageUrl, status, version: status === '배포완료' ? version.trim() || null : null })
      onClose()
    } else {
      setError('저장에 실패했습니다')
    }
    setSubmitting(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[59] bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '90vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-center pt-2.5 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h3 className="font-bold text-gray-900">카드 편집</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted text-lg rounded-full hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-5 py-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">앱/서비스 이름 <span className="text-red-400">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">한 줄 소개</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="한 줄로 서비스를 소개해주세요" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">상세 내용</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="서비스 상세 설명, 기획 배경, 기술 스택 등" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none leading-relaxed" style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">서비스 URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" type="url" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">진행 단계</label>
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_LIST.map(s => {
                  const cfg = STATUS_CONFIG[s]; const active = status === s
                  return (
                    <button key={s} onClick={() => setStatus(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{ background: active ? cfg.color : cfg.bg, color: active ? 'white' : cfg.color, border: `1.5px solid ${cfg.color}` }}>
                      {s}
                    </button>
                  )
                })}
              </div>
              {status === '배포완료' && (
                <input value={version} onChange={e => setVersion(e.target.value)} placeholder="버전 (예: v1.0, v2.3)" className="mt-2 w-full px-3.5 py-2 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">서비스 이미지 (카드 배경)</label>
              {imageUrl ? (
                <div className="relative inline-block">
                  <img src={imageUrl} alt="미리보기" className="h-28 w-auto rounded-xl object-cover" style={{ border: '1px solid var(--border)' }} />
                  <button onClick={() => setImageUrl(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">✕</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40" style={{ border: '1.5px dashed var(--border)', background: '#FAF9F8', color: '#6B7280' }}>
                  {uploading ? '⏳ 업로드 중...' : '🖼️ 이미지 선택'}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onClick={handleSave} disabled={submitting || !title.trim()} className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-40" style={{ background: '#DB2777' }}>
              {submitting ? '저장 중...' : '저장하기'}
            </button>
            <div className="h-4" />
          </div>
        </div>
      </div>
    </>
  )
}

// ── 피드백 내용 파싱 ──────────────────────────────────────────────
const SECTION_STYLES = [
  { color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },  // green
  { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },  // amber
  { color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },  // indigo
]

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '💯', '🤔', '👏', '💡', '😊']
const SAPJIL_EMOJIS = ['👍', '❤️', '🔥', '💯', '🤔', '👏', '💡', '😂']

type ParsedSection = { title: string; items: string[]; color: string; bg: string; border: string }

function parseFeedbackContent(content: string): ParsedSection[] | null {
  // Strip markdown bold/italic markers, trim
  const cleaned = content.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/gm, '')
  const lines = cleaned.split('\n')
  const sections: ParsedSection[] = []
  let current: ParsedSection | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Section header: "1. text", "1) text", "## 1. text" etc.
    const secMatch = line.match(/^(\d+)[.)]\s+(.+)$/)
    if (secMatch) {
      if (current) sections.push(current)
      const idx = parseInt(secMatch[1]) - 1
      const style = SECTION_STYLES[idx] ?? SECTION_STYLES[0]
      current = { title: `${secMatch[1]}. ${secMatch[2].trim()}`, items: [], ...style }
      continue
    }

    if (current) {
      // Roman numerals: "i) text", "ii. text", "iii) text" etc.
      const romanMatch = line.match(/^[ivxlcdm]+[.)]\s+(.+)$/i)
      // Dash/bullet: "- text", "• text"
      const dashMatch = line.match(/^[-•]\s+(.+)$/)
      // Number bullet: "1) text" but NOT section headers (already caught above with 2+ word titles)
      const numBulletMatch = !secMatch && line.match(/^\d+[.)]\s+(.+)$/)

      const itemText = romanMatch?.[1] ?? dashMatch?.[1] ?? numBulletMatch?.[1]
      if (itemText?.trim()) {
        current.items.push(itemText.trim())
      } else if (line && current.items.length > 0 && !line.match(/^\d+[.)]/)) {
        // Continuation line — append to last bullet
        current.items[current.items.length - 1] += ' ' + line
      }
    }
  }

  if (current) sections.push(current)
  return sections.length > 0 ? sections : null
}

function isCommentContent(content: string): { isComment: boolean; parentId: string } {
  const match = content.match(/^__REPLY_TO:([a-f0-9-]+)__\n/)
  if (match) return { isComment: true, parentId: match[1] }
  return { isComment: false, parentId: '' }
}

function extractCommentText(content: string): string {
  return content.replace(/^__REPLY_TO:[a-f0-9-]+__\n/, '')
}

// ── 피드백 카드 ──────────────────────────────────────────────────
function FeedbackCard({ feedback, isMine, creatureId, currentUserId, allFeedbacks, onDelete, onEdit, onAddComment }: {
  feedback: Feedback; isMine: boolean; creatureId: string; currentUserId: string
  allFeedbacks: Feedback[]
  onDelete: (id: string) => void; onEdit: (id: string, content: string) => void
  onAddComment: (parentId: string, content: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(feedback.content)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const isClaude = feedback.feedback_type === 'claude'
  const authorName = feedback.author?.name ?? feedback.author?.nickname ?? '알 수 없음'

  // Get comments for this feedback
  const comments = allFeedbacks.filter(f => {
    const { isComment, parentId } = isCommentContent(f.content)
    return isComment && parentId === feedback.id
  })

  const parsed = isClaude ? parseFeedbackContent(feedback.content) : null

  async function saveEdit() {
    if (!editText.trim()) return
    setSaving(true)
    const res = await fetch(`/api/creatures/${creatureId}/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackId: feedback.id, content: editText.trim() }),
    })
    if (res.ok) { onEdit(feedback.id, editText.trim()); setEditing(false) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('이 피드백을 삭제할까요?')) return
    const res = await fetch(`/api/creatures/${creatureId}/feedback?feedbackId=${feedback.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(feedback.id)
  }

  async function submitComment(content: string) {
    if (!content.trim() || sendingComment) return
    setSendingComment(true)
    try {
      await onAddComment(feedback.id, content.trim())
      setCommentText('')
      setShowCommentInput(false)
    } finally {
      setSendingComment(false)
    }
  }

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: `1.5px solid ${isClaude ? '#DB277730' : 'var(--border)'}`, background: isClaude ? '#FDF2F8' : 'white' }}>
      {/* 헤더 */}
      <div className="px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: isClaude ? '#DB277720' : 'var(--border)' }}>
        <div className="flex items-center gap-2">
          {isClaude ? (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#DB2777' }}>🤖 Claude 피드백</span>
          ) : (
            <>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ background: 'var(--purple)' }}>{authorName.charAt(0)}</div>
              <span className="text-xs font-semibold text-gray-700">{authorName}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted">{formatTime(feedback.created_at)}</span>
          {isMine && !editing && (
            <>
              {isClaude && (
                <button onClick={() => setEditing(v => !v)} className="text-[10px] font-medium" style={{ color: 'var(--purple)' }}>편집</button>
              )}
              <button onClick={handleDelete} className="text-[10px] text-red-300 hover:text-red-500">삭제</button>
            </>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="px-4 py-3">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={10}
              className="w-full text-sm text-gray-700 leading-relaxed outline-none resize-none rounded-lg p-2"
              style={{ border: '1px solid var(--border)', background: '#FAF9F8' }}
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                style={{ background: '#DB2777' }}>{saving ? '저장 중...' : '저장'}</button>
              <button onClick={() => { setEditing(false); setEditText(feedback.content) }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted bg-gray-100">취소</button>
            </div>
          </div>
        ) : parsed ? (
          // 구조화된 Claude 피드백 렌더링
          <div>
            <div className="relative overflow-hidden" style={{ maxHeight: expanded ? 'none' : 260 }}>
              <div className="flex flex-col gap-1.5">
                {parsed.map((sec, i) => (
                  <div key={i} className="rounded-xl px-3 py-2" style={{ background: sec.bg, border: `1px solid ${sec.border}` }}>
                    <p className="text-[11px] font-black mb-1.5" style={{ color: sec.color }}>{sec.title}</p>
                    <ul className="flex flex-col gap-0.5">
                      {sec.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-1.5">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sec.color }} />
                          <span className="text-xs text-gray-700 leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {/* 접혔을 때 그라디언트 페이드 */}
              {!expanded && (
                <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none"
                  style={{ background: `linear-gradient(to bottom, transparent, ${isClaude ? '#FDF2F8' : 'white'})` }} />
              )}
            </div>
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full text-xs font-semibold py-1.5 mt-1.5 rounded-lg"
              style={{ color: '#DB2777', background: '#FFF0F6' }}
            >
              {expanded ? '▲ 접기' : '▼ 전체 보기'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-snug whitespace-pre-wrap">{feedback.content}</p>
        )}
      </div>

      {/* 댓글 영역 */}
      <div className="border-t px-4 py-2.5" style={{ borderColor: isClaude ? '#DB277715' : 'var(--border)' }}>
        {/* 기존 댓글 목록 */}
        {comments.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            {comments.map(c => {
              const cAuthorRaw = c.author as any
              const cAuthor = Array.isArray(cAuthorRaw) ? cAuthorRaw[0] : cAuthorRaw
              const cName = cAuthor?.name ?? cAuthor?.nickname ?? '?'
              const cText = extractCommentText(c.content)
              return (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5" style={{ background: 'var(--purple)' }}>{cName.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-gray-700 mr-1.5">{cName}</span>
                    <span className="text-xs text-gray-600">{cText}</span>
                  </div>
                  <span className="text-[10px] text-muted shrink-0">{formatTime(c.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* 빠른 이모지 + 댓글 버튼 */}
        {!showCommentInput && (
          <div className="flex items-center gap-1 flex-wrap">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => submitComment(emoji)}
                disabled={sendingComment}
                className="text-base leading-none px-1.5 py-1 rounded-lg hover:bg-gray-100 active:scale-110 transition-transform disabled:opacity-50"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowCommentInput(true)}
              className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-lg"
              style={{ color: 'var(--purple)', background: 'var(--purple-light)' }}
            >
              💬 댓글
            </button>
          </div>
        )}

        {/* 댓글 입력창 */}
        {showCommentInput && (
          <div className="flex items-end gap-2 mt-1">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(commentText) } }}
              placeholder="질문이나 코멘트를 남겨주세요..."
              rows={2}
              autoFocus
              className="flex-1 text-xs text-gray-700 leading-relaxed outline-none resize-none rounded-lg px-3 py-2"
              style={{ border: '1px solid var(--border)', background: '#FAF9F8' }}
            />
            <div className="flex flex-col gap-1">
              <button onClick={() => submitComment(commentText)} disabled={!commentText.trim() || sendingComment}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                style={{ background: 'var(--purple)' }}>전송</button>
              <button onClick={() => { setShowCommentInput(false); setCommentText('') }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted bg-gray-100">취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 삽질기 포스트 카드 ────────────────────────────────────────────
function SapjilPostCard({ post, canEdit, isAdmin, currentUserId, onEdit, onDelete }: {
  post: SapjilPost; canEdit: boolean; isAdmin: boolean; currentUserId: string
  onEdit: (id: string, updated: Partial<SapjilPost>) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editContent, setEditContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const [reactions, setReactions] = useState<{ emoji: string; count: number; userIds: string[] }[]>(post.reactions ?? [])
  const [comments, setComments] = useState<SapjilComment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [togglingEmoji, setTogglingEmoji] = useState(false)

  const isLong = post.content.length > 120

  // 마운트시 댓글 로드
  useEffect(() => { loadComments() }, [post.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadComments() {
    if (commentsLoaded) return
    const res = await fetch(`/api/sapjil/${post.id}/comments`)
    if (res.ok) { setComments(await res.json()); setCommentsLoaded(true) }
  }

  async function toggleReaction(emoji: string) {
    if (canEdit) return // 본인 글 반응 불가
    if (togglingEmoji) return
    setTogglingEmoji(true)
    try {
      const res = await fetch(`/api/sapjil/${post.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (res.ok) {
        const { reacted, previousEmoji } = await res.json()
        setReactions(prev => {
          let u = [...prev]
          if (previousEmoji && previousEmoji !== emoji) {
            u = u.map(r => r.emoji === previousEmoji
              ? { ...r, count: r.count - 1, userIds: r.userIds.filter(id => id !== currentUserId) }
              : r).filter(r => r.count > 0)
          }
          const ex = u.find(r => r.emoji === emoji)
          if (reacted) {
            if (ex) u = u.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, userIds: [...r.userIds, currentUserId] } : r)
            else u = [...u, { emoji, count: 1, userIds: [currentUserId] }]
          } else {
            u = u.map(r => r.emoji === emoji
              ? { ...r, count: r.count - 1, userIds: r.userIds.filter(id => id !== currentUserId) }
              : r).filter(r => r.count > 0)
          }
          return u
        })
      }
    } finally { setTogglingEmoji(false) }
  }

  async function submitComment() {
    if (!commentText.trim() || sendingComment) return
    setSendingComment(true)
    try {
      const res = await fetch(`/api/sapjil/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() }),
      })
      if (res.ok) { const c = await res.json(); setComments(prev => [...prev, c]); setCommentText(''); setShowCommentInput(false) }
    } finally { setSendingComment(false) }
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/sapjil/${post.id}/comments?id=${commentId}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  async function handleSaveEdit() {
    if (!editTitle.trim()) return
    setSaving(true)
    const res = await fetch(`/api/sapjil/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
    })
    if (res.ok) { onEdit(post.id, { title: editTitle.trim(), content: editContent.trim() }); setEditing(false) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('이 삽질기 글을 삭제할까요?')) return
    const res = await fetch(`/api/sapjil/${post.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(post.id)
  }

  return (
    <div className="rounded-[14px] overflow-hidden bg-white" style={{ border: '0.5px solid var(--border)' }}>
      <div className="px-4 pt-3.5 pb-2">
        {editing ? (
          <div className="flex flex-col gap-2">
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none"
              style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5}
              className="w-full text-sm text-gray-700 leading-relaxed outline-none resize-none rounded-lg px-3 py-2"
              style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                style={{ background: '#6366F1' }}>{saving ? '저장 중...' : '저장'}</button>
              <button onClick={() => { setEditing(false); setEditTitle(post.title); setEditContent(post.content) }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted bg-gray-100">취소</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-sm mt-0.5" style={{ background: '#EEF2FF' }}>🔧</div>
                <h4 className="text-sm font-bold text-gray-900 leading-snug">{post.title}</h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted">{formatTime(post.created_at)}</span>
                {canEdit && (
                  <>
                    <button onClick={() => setEditing(true)} className="text-[10px] font-medium" style={{ color: '#6366F1' }}>편집</button>
                    <button onClick={handleDelete} className="text-[10px] text-red-300 hover:text-red-500">삭제</button>
                  </>
                )}
              </div>
            </div>
            <div className="relative overflow-hidden pl-8" style={{ maxHeight: expanded || !isLong ? 'none' : 72 }}>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {!expanded && isLong && (
                <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent, white)' }} />
              )}
            </div>
            {isLong && (
              <button onClick={() => setExpanded(v => !v)} className="text-[11px] font-medium pl-8 mt-0.5" style={{ color: '#6366F1' }}>
                {expanded ? '접기' : '더 보기'}
              </button>
            )}
            {post.image_url && (
              <img src={post.image_url} alt="첨부 이미지"
                className="mt-2 w-full rounded-xl object-cover cursor-pointer"
                style={{ maxHeight: 200 }}
                onClick={() => window.open(post.image_url!, '_blank')} />
            )}
          </>
        )}
      </div>

      {/* 반응 + 댓글 영역 */}
      {!editing && (
        <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
          {/* 기존 반응 뱃지 */}
          {reactions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {reactions.map(r => (
                <button key={r.emoji} onClick={() => toggleReaction(r.emoji)} disabled={canEdit || togglingEmoji}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors disabled:cursor-default"
                  style={{
                    background: r.userIds.includes(currentUserId) ? '#EEF2FF' : '#F3F4F6',
                    border: r.userIds.includes(currentUserId) ? '1px solid #C7D2FE' : '1px solid transparent',
                    color: r.userIds.includes(currentUserId) ? '#6366F1' : '#374151',
                  }}>
                  {r.emoji} <span className="font-semibold">{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* 댓글 목록 */}
          {comments.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {comments.map(c => {
                const cName = c.user?.name ?? c.user?.nickname ?? '?'
                const canDeleteComment = c.user?.id === currentUserId || isAdmin
                return (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5" style={{ background: '#6366F1' }}>{cName.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-gray-700 mr-1.5">{cName}</span>
                      <span className="text-xs text-gray-600">{c.text}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted">{formatTime(c.created_at)}</span>
                      {canDeleteComment && (
                        <button onClick={() => deleteComment(c.id)} className="text-[10px] text-red-300 hover:text-red-500">✕</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 이모지 버튼 + 댓글 입력 */}
          {!showCommentInput ? (
            <div className="flex items-center gap-1 flex-wrap">
              {!canEdit && SAPJIL_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => toggleReaction(emoji)} disabled={togglingEmoji}
                  className="text-base leading-none px-1.5 py-1 rounded-lg hover:bg-gray-100 active:scale-110 transition-transform disabled:opacity-50">
                  {emoji}
                </button>
              ))}
              <button onClick={() => { setShowCommentInput(true); if (!commentsLoaded) loadComments() }}
                className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-lg"
                style={{ color: '#6366F1', background: '#EEF2FF' }}>
                💬 댓글
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                placeholder="댓글을 남겨주세요..." rows={2} autoFocus
                className="flex-1 text-xs text-gray-700 leading-relaxed outline-none resize-none rounded-lg px-3 py-2"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }}
              />
              <div className="flex flex-col gap-1">
                <button onClick={submitComment} disabled={!commentText.trim() || sendingComment}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                  style={{ background: '#6366F1' }}>전송</button>
                <button onClick={() => { setShowCommentInput(false); setCommentText('') }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted bg-gray-100">취소</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 삽질기 패널 ──────────────────────────────────────────────────
function SapjilPanel({ initialPosts, isMine, isAdmin, currentUserId }: {
  initialPosts: SapjilPost[]; isMine: boolean; isAdmin: boolean; currentUserId: string
}) {
  const [open, setOpen] = useState(false)
  const [posts, setPosts] = useState(initialPosts)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!newTitle.trim() || !newContent.trim()) return
    setAdding(true)
    const res = await fetch('/api/sapjil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }),
    })
    if (res.ok) {
      const newPost = await res.json()
      setPosts(prev => [newPost, ...prev])
      setNewTitle(''); setNewContent(''); setShowAddForm(false)
    }
    setAdding(false)
  }

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid #C7D2FE', background: '#F5F3FF' }}>
      {/* 토글 버튼 */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-base">🔧</span>
          <span className="text-sm font-black text-gray-900">조물주의 삽질기</span>
          {posts.length > 0 && <span className="text-xs text-muted">({posts.length}개)</span>}
        </div>
        <span className="text-muted text-base transition-transform duration-200"
          style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {/* 글 추가 버튼 (작성자만) */}
          {isMine && !showAddForm && (
            <button onClick={() => setShowAddForm(true)}
              className="w-full py-2 rounded-xl text-xs font-bold"
              style={{ background: '#EEF2FF', color: '#6366F1', border: '1.5px dashed #C7D2FE' }}>
              + 글 추가하기
            </button>
          )}

          {/* 새 글 작성 폼 */}
          {showAddForm && (
            <div className="rounded-[14px] bg-white p-3 flex flex-col gap-2" style={{ border: '1px solid #C7D2FE' }}>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="제목"
                className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={4}
                placeholder="개발하면서 겪은 삽질, 배운 점 등을 자유롭게 써주세요"
                className="w-full text-sm text-gray-700 leading-relaxed outline-none resize-none rounded-lg px-3 py-2"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={adding || !newTitle.trim() || !newContent.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: '#6366F1' }}>{adding ? '등록 중...' : '등록'}</button>
                <button onClick={() => { setShowAddForm(false); setNewTitle(''); setNewContent('') }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted bg-gray-100">취소</button>
              </div>
            </div>
          )}

          {posts.length === 0 && !showAddForm && (
            <p className="text-xs text-center text-muted py-4">아직 삽질기가 없어요</p>
          )}

          {posts.map(post => (
            <SapjilPostCard
              key={post.id}
              post={post}
              canEdit={isMine || isAdmin}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onEdit={(id, updated) => setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))}
              onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MakerDetailClient({
  creature: initialCreature,
  feedbacks: initialFeedbacks,
  sapjilPosts = [],
  currentUserId,
  isAdmin,
}: {
  creature: Creature
  feedbacks: Feedback[]
  sapjilPosts?: SapjilPost[]
  currentUserId: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [creature, setCreature] = useState(initialCreature)
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks)
  const [showEdit, setShowEdit] = useState(false)
  const [generatingClaude, setGeneratingClaude] = useState(false)
  const [peerText, setPeerText] = useState('')
  const [sendingPeer, setSendingPeer] = useState(false)
  const [showPeerInput, setShowPeerInput] = useState(false)

  const isMine = creature.author?.id === currentUserId
  const st = STATUS_CONFIG[creature.status ?? '기획안'] ?? STATUS_CONFIG['기획안']
  const authorName = creature.author?.name ?? creature.author?.nickname ?? '알 수 없음'

  async function generateClaude() {
    setGeneratingClaude(true)
    const res = await fetch(`/api/creatures/${creature.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'claude' }),
    })
    if (res.ok) {
      const newFeedback = await res.json()
      setFeedbacks(prev => [...prev, newFeedback])
    }
    setGeneratingClaude(false)
  }

  async function submitPeer() {
    if (!peerText.trim() || sendingPeer) return
    setSendingPeer(true)
    const res = await fetch(`/api/creatures/${creature.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'peer', content: peerText.trim() }),
    })
    if (res.ok) {
      const newFeedback = await res.json()
      setFeedbacks(prev => [...prev, newFeedback])
      setPeerText('')
      setShowPeerInput(false)
    }
    setSendingPeer(false)
  }

  function deleteFeedback(id: string) {
    setFeedbacks(prev => prev.filter(f => f.id !== id))
  }

  function editFeedback(id: string, content: string) {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, content } : f))
  }

  async function addComment(parentFeedbackId: string, content: string) {
    const res = await fetch(`/api/creatures/${creature.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'comment', parentFeedbackId, content }),
    })
    if (res.ok) {
      const newComment = await res.json()
      setFeedbacks(prev => [...prev, newComment])
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* 헤더 */}
      <div className="relative" style={{ minHeight: 200 }}>
        {creature.image_url ? (
          <>
            <img src={creature.image_url} alt={creature.title} className="w-full object-cover" style={{ height: 220 }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </>
        ) : (
          <div className="w-full flex items-center justify-center" style={{ height: 160, background: `linear-gradient(135deg, ${st.color}20, ${st.color}10)` }}>
            <span className="text-7xl opacity-40">🛸</span>
          </div>
        )}

        {/* 뒤로가기 */}
        <button onClick={() => router.back()}
          className="absolute top-12 left-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
          ‹
        </button>

        {/* 편집 버튼 (내 피조물) */}
        {(isMine || isAdmin) && (
          <button onClick={() => setShowEdit(true)}
            className="absolute top-12 right-4 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-semibold">
            편집
          </button>
        )}

        {/* 타이틀 (이미지 위) */}
        {creature.image_url && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <p className="text-white font-black text-xl leading-tight">{creature.title}</p>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* 이미지 없을 때 타이틀 */}
        {!creature.image_url && (
          <h1 className="text-xl font-black text-gray-900">{creature.title}</h1>
        )}

        {/* 작성자 + 날짜 */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: 'var(--purple)' }}>{authorName.charAt(0)}</div>
          <span className="text-xs font-semibold text-gray-700">{authorName}</span>
          <span className="text-[10px] text-muted">{formatDate(creature.created_at)}</span>
        </div>

        {/* 진행 단계 스텝퍼 */}
        <div className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
          <p className="text-[10px] font-bold text-muted mb-3">진행 단계</p>
          <StatusStepper status={creature.status} />
          {creature.version && (
            <div className="mt-3 flex items-center gap-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: st.color, color: 'white' }}>{creature.version}</span>
            </div>
          )}
        </div>

        {/* 한 줄 소개 */}
        {creature.description && (
          <p className="text-sm font-semibold text-gray-800 leading-relaxed">{creature.description}</p>
        )}

        {/* 상세 내용 */}
        {creature.content && (
          <div className="bg-white rounded-[14px] px-4 py-3" style={{ border: '0.5px solid var(--border)' }}>
            <p className="text-[10px] font-bold text-muted mb-2">상세 내용</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{creature.content}</p>
          </div>
        )}

        {/* URL 버튼 */}
        {creature.url && (
          <a href={creature.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity active:opacity-80"
            style={{ background: st.color }}>
            🔗 서비스 바로가기
          </a>
        )}

        {/* ── 피드백 섹션 ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900">
              피드백 {feedbacks.length > 0 ? `(${feedbacks.length})` : ''}
            </h2>
          </div>

          {/* 피드백 목록 */}
          {feedbacks.filter(f => !f.content.startsWith('__REPLY_TO:')).map(f => (
            <FeedbackCard
              key={f.id}
              feedback={f}
              isMine={isMine || isAdmin || f.author?.id === currentUserId}
              creatureId={creature.id}
              currentUserId={currentUserId}
              allFeedbacks={feedbacks}
              onDelete={deleteFeedback}
              onEdit={editFeedback}
              onAddComment={addComment}
            />
          ))}

          {feedbacks.length === 0 && (
            <div className="rounded-[14px] py-8 flex flex-col items-center gap-2 bg-gray-50">
              <span className="text-2xl">💬</span>
              <p className="text-xs text-muted">아직 피드백이 없어요</p>
            </div>
          )}

          {/* Claude 피드백 받기 */}
          <button
            onClick={generateClaude}
            disabled={generatingClaude}
            className="w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity active:opacity-80"
            style={{ background: generatingClaude ? '#F3E8FF' : '#7C3AED', color: generatingClaude ? '#7C3AED' : 'white', border: '2px solid #7C3AED' }}
          >
            {generatingClaude ? (
              <>
                <span className="animate-spin">⚙️</span>
                Claude가 피드백을 작성 중...
              </>
            ) : (
              <>🤖 Claude 피드백 받기</>
            )}
          </button>

          {/* 멤버 피드백 남기기 */}
          {!isMine && (
            <div>
              {showPeerInput ? (
                <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-xs font-bold text-gray-700">피드백 남기기</p>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    <textarea
                      value={peerText}
                      onChange={e => setPeerText(e.target.value)}
                      placeholder="사용해보고 느낀 점, 개선 아이디어, 응원 등 자유롭게 남겨주세요"
                      rows={4}
                      className="w-full text-sm outline-none resize-none leading-relaxed rounded-lg px-3 py-2"
                      style={{ border: '1px solid var(--border)', background: '#FAF9F8' }}
                    />
                    <div className="flex gap-2">
                      <button onClick={submitPeer} disabled={!peerText.trim() || sendingPeer}
                        className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-40"
                        style={{ background: '#DB2777' }}>
                        {sendingPeer ? '등록 중...' : '피드백 등록'}
                      </button>
                      <button onClick={() => setShowPeerInput(false)}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted bg-gray-100">
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPeerInput(true)}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity active:opacity-80"
                  style={{ background: '#FDF2F8', color: '#DB2777', border: '2px solid #DB277730' }}
                >
                  💬 피드백 남기기
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 조물주의 삽질기 ── */}
        <SapjilPanel
          initialPosts={sapjilPosts}
          isMine={isMine}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      </div>

      {/* 편집 모달 */}
      {showEdit && (
        <EditModal
          creature={creature}
          onClose={() => setShowEdit(false)}
          onSaved={updated => setCreature(updated)}
        />
      )}
    </div>
  )
}
// v1776725856
