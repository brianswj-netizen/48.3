'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Toast, useToast } from './Toast'
import MentionCommentInput, { type MemberOption } from './MentionCommentInput'
import MentionText from './MentionText'

const CATEGORIES = ['전체', '모임 관련', '앱 개선', '스터디·학습', '콘텐츠·자료', '기타'] as const

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  open:     { label: '신규',   bg: 'var(--purple-light)', color: 'var(--purple)' },
  review:   { label: '검토중', bg: 'var(--amber-light)',  color: 'var(--amber)' },
  accepted: { label: '채택됨', bg: 'var(--teal-light)',   color: 'var(--teal)' },
  resolved: { label: '해결됨', bg: '#DCFCE7',             color: '#16A34A' },
  closed:   { label: '완료',   bg: '#F3F4F6',             color: '#6B7280' },
}

type Suggestion = {
  id: string
  title: string
  description: string | null
  category: string | null
  status: string
  created_at: string
  author_id: string | null
  author: { name: string | null; nickname: string | null } | null
  like_count?: number
  liked_by_me?: boolean
  comment_count?: number
}

type Comment = {
  id: string
  text: string
  created_at: string
  author_id: string
  author: { name: string | null; nickname: string | null } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

function formatCommentTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return '방금'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// ─── 제안 작성 모달 (모바일 픽스: sticky 버튼) ───
function AddSuggestionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    setSaving(true)
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category: category || null }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? '저장 실패'); return }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] flex flex-col"
        style={{ maxHeight: '80dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-base font-black text-gray-900">제안 작성</h2>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 flex flex-col gap-3">
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none bg-white">
            <option value="">카테고리 선택</option>
            {CATEGORIES.filter(c => c !== '전체').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="제안 제목" maxLength={100}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500" />
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="내용을 입력해주세요 (선택사항)" maxLength={500}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 resize-none h-20" />
        </div>

        {/* 고정 버튼 영역 */}
        <div className="px-5 pb-6 pt-3 border-t border-border shrink-0 flex gap-2"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border text-gray-600">
            취소
          </button>
          <button type="button" onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--purple)' }}>
            {saving ? '저장 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 댓글 섹션 ───
function CommentSection({ suggestionId, currentUserId, currentUserName, isAuthor, isAdmin, members, onCountChange }:
  { suggestionId: string; currentUserId: string | null; currentUserName?: string | null; isAuthor: boolean; isAdmin: boolean; members?: MemberOption[]; onCountChange?: (count: number) => void }) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [postError, setPostError] = useState('')

  async function deleteComment(commentId: string) {
    if (!confirm('댓글을 삭제할까요?')) return
    const res = await fetch(`/api/suggestions/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setComments(prev => {
        const next = (prev ?? []).filter(c => c.id !== commentId)
        onCountChange?.(next.length)
        return next
      })
    }
  }

  async function loadComments() {
    setLoading(true)
    const res = await fetch(`/api/suggestions/${suggestionId}/comments`)
    const data = await res.json()
    setLoading(false)
    if (Array.isArray(data)) {
      setComments(data)
      onCountChange?.(data.length)
    } else {
      setComments([])
      onCountChange?.(0)
    }
  }

  async function postComment(text: string) {
    setPostError('')
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json = await res.json()
      if (!res.ok) setPostError(json.error ?? '등록 실패. 잠시 후 다시 시도해주세요.')
      else {
        setComments(prev => {
          const next = [...(prev ?? []), json]
          onCountChange?.(next.length)
          return next
        })
      }
    } catch {
      setPostError('네트워크 오류. 다시 시도해주세요.')
    }
  }

  // 첫 렌더 시 자동 로드
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadComments() }, [suggestionId])

  const canComment = !!currentUserId

  return (
    <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
      {loading && <p className="text-xs text-muted text-center py-2">불러오는 중...</p>}

      {comments && comments.length === 0 && (
        <p className="text-xs text-muted text-center py-1">아직 의견이 없습니다.</p>
      )}

      {comments && comments.map(c => {
        const authorRaw = c.author as any
        const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw
        const name = author?.name ?? author?.nickname ?? '알 수 없음'
        return (
          <div key={c.id} className="flex gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: 'var(--purple)' }}>
              {name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-gray-800">{name}</span>
                <span className="text-[10px] text-muted">{formatCommentTime(c.created_at)}</span>
                {(isAdmin || c.author_id === currentUserId) && (
                  <button onClick={() => deleteComment(c.id)}
                    className="text-[10px] text-red-300 hover:text-red-500 ml-auto">삭제</button>
                )}
              </div>
              <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
                <MentionText text={c.text} currentUserName={currentUserName} />
              </p>
            </div>
          </div>
        )
      })}

      {postError && (
        <p className="text-[11px] text-red-500 px-1">{postError}</p>
      )}

      {canComment && (
        <div className="mt-1">
          <MentionCommentInput onSend={postComment} members={members} />
        </div>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ───
export default function SuggestionsClient({
  suggestions: initialSuggestions,
  currentUserId,
  currentUserName,
  isAdmin,
  members = [],
}: {
  suggestions: Suggestion[]
  currentUserId: string | null
  currentUserName?: string | null
  isAdmin: boolean
  members?: MemberOption[]
}) {
  const router = useRouter()
  const [category, setCategory] = useState('전체')
  const [sort, setSort] = useState<'likes' | 'recent'>('recent')
  const [showAdd, setShowAdd] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [openComments, setOpenComments] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(initialSuggestions.map(s => [s.id, s.comment_count ?? 0]))
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const { message: toastMsg, showToast } = useToast()

  function startEdit(s: Suggestion) {
    setEditingId(s.id)
    setEditTitle(s.title)
    setEditDescription(s.description ?? '')
    setEditCategory(s.category ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditCategory('')
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim()) return
    setSavingEdit(true)
    const res = await fetch(`/api/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, description: editDescription, category: editCategory || null }),
    })
    setSavingEdit(false)
    if (res.ok) {
      setSuggestions(prev => prev.map(s =>
        s.id === id ? { ...s, title: editTitle, description: editDescription || null, category: editCategory || null } : s
      ))
      cancelEdit()
      showToast('제안이 수정됐습니다.')
    }
  }

  const filtered = [...suggestions]
    .filter(s => category === '전체' || s.category === category)

  const unresolved = filtered
    .filter(s => s.status !== 'resolved')
    .sort((a, b) => sort === 'likes'
      ? (b.like_count ?? 0) - (a.like_count ?? 0)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  const resolved = filtered
    .filter(s => s.status === 'resolved')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  async function handleLike(id: string) {
    const res = await fetch(`/api/suggestions/${id}/vote`, { method: 'POST' })
    if (!res.ok) return
    const json = await res.json()
    setSuggestions(prev => prev.map(s =>
      s.id === id
        ? { ...s, like_count: (s.like_count ?? 0) + (json.liked ? 1 : -1), liked_by_me: json.liked }
        : s
    ))
  }

  async function handleDeleteSuggestion(id: string) {
    if (!confirm('제안을 삭제할까요?')) return
    const res = await fetch(`/api/suggestions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSuggestions(prev => prev.filter(s => s.id !== id))
      showToast('삭제됐습니다.')
    }
  }

  async function handleResolve(id: string) {
    const res = await fetch(`/api/suggestions/${id}/resolve`, { method: 'POST' })
    if (!res.ok) return
    const json = await res.json()
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: json.status } : s))
    showToast(json.status === 'resolved' ? '✅ 해결됨으로 표시했습니다!' : '↩️ 상태를 되돌렸습니다')
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-0 md:pt-6" style={{ background: '#8858B0' }}>
        <h1 className="text-xl font-black text-white pb-3">제안</h1>
        <div className="flex overflow-x-auto gap-2 pb-3 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={category === c
                ? { background: 'rgba(255,255,255,0.9)', color: '#8858B0' }
                : { background: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)' }}>
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="flex items-center gap-3 px-4 py-3">
        {(['likes', 'recent'] as const).map(s => (
          <button key={s} onClick={() => setSort(s)}
            className="text-xs font-medium"
            style={{ color: sort === s ? 'var(--purple)' : 'var(--muted)' }}>
            {s === 'likes' ? '공감 많은순' : '최신순'}
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-3 pb-24">
        {unresolved.length === 0 && resolved.length === 0 && (
          <p className="text-sm text-muted text-center py-12">제안이 없습니다.</p>
        )}
        {unresolved.map(s => {
          const st = STATUS_CONFIG[s.status] ?? STATUS_CONFIG['open']
          const authorRaw = s.author as any
          const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw
          const authorName = author?.name ?? author?.nickname ?? ''
          const isAuthor = !!currentUserId && s.author_id === currentUserId
          const canResolve = isAuthor || isAdmin
          const showComments = openComments === s.id

          return (
            <div key={s.id} className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
              {editingId === s.id ? (
                /* ── 수정 모드 ── */
                <div className="flex flex-col gap-2">
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                    className="text-sm border border-border rounded-xl px-3 py-2 outline-none bg-white">
                    <option value="">카테고리 선택</option>
                    {CATEGORIES.filter(c => c !== '전체').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    placeholder="제안 제목" maxLength={100}
                    className="text-sm border border-border rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-semibold" />
                  <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                    placeholder="내용 (선택사항)" maxLength={500}
                    className="text-sm border border-border rounded-xl px-3 py-2 outline-none focus:border-purple-500 resize-none h-20" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(s.id)} disabled={savingEdit || !editTitle.trim()}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                      style={{ background: 'var(--purple)' }}>
                      {savingEdit ? '저장 중...' : '저장'}
                    </button>
                    <button onClick={cancelEdit} disabled={savingEdit}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold text-muted bg-gray-100">
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 상단: 상태 + 카테고리 */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                    {s.category && <span className="text-[11px] text-muted shrink-0">{s.category}</span>}
                  </div>

                  {/* 제목 + 내용 */}
                  <p className="text-sm font-bold text-gray-900 mt-1">{s.title}</p>
                  {s.description && <p className="text-xs text-muted mt-1 leading-relaxed">{s.description}</p>}

                  {/* 하단: 작성자 + 공감 + 의견 + 해결됨 */}
                  <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                    <span className="text-xs text-muted">{authorName}{authorName && ' · '}{formatDate(s.created_at)}</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 해결됨 버튼 (작성자/admin) */}
                      {canResolve && (
                        <button
                          onClick={() => handleResolve(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                          style={s.status === 'resolved'
                            ? { background: '#DCFCE7', color: '#16A34A' }
                            : { background: '#F3F4F6', color: '#6B7280' }}>
                          ✅ {s.status === 'resolved' ? '해결됨' : '해결?'}
                        </button>
                      )}
                      {/* 의견 버튼 */}
                      <button
                        onClick={() => setOpenComments(showComments ? null : s.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                        style={showComments
                          ? { background: 'var(--purple)', color: 'white' }
                          : { background: '#F3F4F6', color: '#6B7280' }}>
                        💬 {(commentCounts[s.id] ?? 0) > 0 ? commentCounts[s.id] : '의견'}
                      </button>
                      {/* 공감 버튼 */}
                      <button
                        onClick={() => handleLike(s.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                        style={s.liked_by_me
                          ? { background: 'var(--purple)', color: 'white' }
                          : { background: 'var(--purple-light)', color: 'var(--purple)' }}>
                        👍 {s.like_count ?? 0}
                      </button>
                    </div>
                  </div>

                  {/* 작성자 수정 + 어드민 삭제 버튼 */}
                  <div className="flex items-center gap-3 mt-2">
                    {isAuthor && (
                      <button onClick={() => startEdit(s)}
                        className="text-[10px] text-blue-400 hover:text-blue-600">
                        ✏️ 수정
                      </button>
                    )}
                    {(isAdmin || isAuthor) && (
                      <button onClick={() => handleDeleteSuggestion(s.id)}
                        className="text-[10px] text-red-400 hover:text-red-600">
                        🗑 삭제
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* 댓글 섹션 */}
              {showComments && editingId !== s.id && (
                <CommentSection
                  suggestionId={s.id}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  isAuthor={isAuthor}
                  isAdmin={isAdmin}
                  members={members}
                  onCountChange={(count) => setCommentCounts(prev => ({ ...prev, [s.id]: count }))}
                />
              )}
            </div>
          )
        })}

        {resolved.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowResolved(r => !r)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-[14px] text-sm font-semibold text-gray-500 bg-gray-100"
            >
              <span>✅ 해결된 제안 {resolved.length}건</span>
              <span>{showResolved ? '▲' : '▼'}</span>
            </button>
            {showResolved && (
              <div className="flex flex-col gap-2 mt-2">
                {resolved.map(s => {
                  const st = STATUS_CONFIG[s.status] ?? STATUS_CONFIG['open']
                  const authorRaw = s.author as any
                  const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw
                  const authorName = author?.name ?? author?.nickname ?? ''
                  const isAuthor = !!currentUserId && s.author_id === currentUserId
                  const canResolve = isAuthor || isAdmin
                  const showComments = openComments === s.id

                  return (
                    <div key={s.id} className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
                      {editingId === s.id ? (
                        <div className="flex flex-col gap-2">
                          <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                            className="text-sm border border-border rounded-xl px-3 py-2 outline-none bg-white">
                            <option value="">카테고리 선택</option>
                            {CATEGORIES.filter(c => c !== '전체').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                            placeholder="제안 제목" maxLength={100}
                            className="text-sm border border-border rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-semibold" />
                          <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                            placeholder="내용 (선택사항)" maxLength={500}
                            className="text-sm border border-border rounded-xl px-3 py-2 outline-none focus:border-purple-500 resize-none h-20" />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(s.id)} disabled={savingEdit || !editTitle.trim()}
                              className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                              style={{ background: 'var(--purple)' }}>
                              {savingEdit ? '저장 중...' : '저장'}
                            </button>
                            <button onClick={cancelEdit} disabled={savingEdit}
                              className="flex-1 py-2 rounded-xl text-sm font-semibold text-muted bg-gray-100">
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 상단: 상태 + 카테고리 */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: st.bg, color: st.color }}>
                              {st.label}
                            </span>
                            {s.category && <span className="text-[11px] text-muted shrink-0">{s.category}</span>}
                          </div>

                          {/* 제목 + 내용 */}
                          <p className="text-sm font-bold text-gray-900 mt-1">{s.title}</p>
                          {s.description && <p className="text-xs text-muted mt-1 leading-relaxed">{s.description}</p>}

                          {/* 하단: 작성자 + 공감 + 의견 + 해결됨 */}
                          <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                            <span className="text-xs text-muted">{authorName}{authorName && ' · '}{formatDate(s.created_at)}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {canResolve && (
                                <button onClick={() => handleResolve(s.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                                  style={s.status === 'resolved'
                                    ? { background: '#DCFCE7', color: '#16A34A' }
                                    : { background: '#F3F4F6', color: '#6B7280' }}>
                                  ✅ {s.status === 'resolved' ? '해결됨' : '해결?'}
                                </button>
                              )}
                              <button onClick={() => setOpenComments(showComments ? null : s.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                                style={showComments
                                  ? { background: 'var(--purple)', color: 'white' }
                                  : { background: '#F3F4F6', color: '#6B7280' }}>
                                💬 {(commentCounts[s.id] ?? 0) > 0 ? commentCounts[s.id] : '의견'}
                              </button>
                              <button onClick={() => handleLike(s.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                                style={s.liked_by_me
                                  ? { background: 'var(--purple)', color: 'white' }
                                  : { background: 'var(--purple-light)', color: 'var(--purple)' }}>
                                👍 {s.like_count ?? 0}
                              </button>
                            </div>
                          </div>

                          {/* 작성자 수정 + 삭제 버튼 */}
                          <div className="flex items-center gap-3 mt-2">
                            {isAuthor && (
                              <button onClick={() => startEdit(s)}
                                className="text-[10px] text-blue-400 hover:text-blue-600">
                                ✏️ 수정
                              </button>
                            )}
                            {(isAdmin || isAuthor) && (
                              <button onClick={() => handleDeleteSuggestion(s.id)}
                                className="text-[10px] text-red-400 hover:text-red-600">
                                🗑 삭제
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {/* 댓글 섹션 */}
                      {showComments && editingId !== s.id && (
                        <CommentSection
                          suggestionId={s.id}
                          currentUserId={currentUserId}
                          currentUserName={currentUserName}
                          isAuthor={isAuthor}
                          isAdmin={isAdmin}
                          members={members}
                          onCountChange={(count) => setCommentCounts(prev => ({ ...prev, [s.id]: count }))}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Toast message={toastMsg} />

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 flex items-center gap-2 px-4 h-12 rounded-full text-white text-sm font-bold shadow-lg md:bottom-8"
        style={{ background: 'var(--purple)' }}>
        <span className="text-lg leading-none">+</span> 제안하기
      </button>

      {showAdd && (
        <AddSuggestionModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { router.refresh(); showToast('제안이 등록됐습니다! 👍') }}
        />
      )}
    </div>
  )
}
