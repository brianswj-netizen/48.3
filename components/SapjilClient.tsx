'use client'

import { useState, useRef, useEffect } from 'react'

type Reaction = { emoji: string; count: number; mine: boolean }
type Comment = {
  id: string; text: string; created_at: string
  user: { id: string; name: string | null; nickname: string | null } | null
}
type Post = {
  id: string; title: string; content: string; image_url?: string | null; created_at: string
  author: { id: string; name: string | null; nickname: string | null; avatar_url?: string | null } | null
  reactions: Reaction[]
}
type Props = { initialPosts: Post[]; currentUserId: string; isAdmin?: boolean }

const QUICK_EMOJIS = ['❤️', '😂', '👍', '🙏', '🔥', '😮']

function formatDate(iso: string) {
  const d = new Date(iso), diff = Date.now() - d.getTime()
  if (diff < 60_000) return '방금'
  if (diff < 3_600_000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86_400_000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function CommentDrawer({ postId, currentUserId, isAdmin, isOpen, onClose, onCountChange }: {
  postId: string; currentUserId: string; isAdmin?: boolean
  isOpen: boolean; onClose: () => void; onCountChange?: (n: number) => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/sapjil/${postId}/comments`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) { setComments(d); onCountChange?.(d.length) }
    }).finally(() => setLoading(false))
  }, [isOpen, postId])

  useEffect(() => {
    if (comments.length > 0) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [comments.length])

  async function submit() {
    if (!text.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/sapjil/${postId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments(p => { const n = [...p, c]; onCountChange?.(n.length); return n })
      setText('')
    }
    setSending(false)
  }

  async function del(cid: string) {
    const res = await fetch(`/api/sapjil/${postId}/comments?id=${cid}`, { method: 'DELETE' })
    if (res.ok) setComments(p => { const n = p.filter(c => c.id !== cid); onCountChange?.(n.length); return n })
  }

  if (!isOpen) return null
  return (
    <>
      <div className="fixed inset-0 z-[59] bg-black/30" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '72vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h3 className="font-bold text-sm text-gray-900">댓글{comments.length > 0 ? ` ${comments.length}` : ''}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted text-lg rounded-full hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 min-h-0">
          {loading ? (
            <p className="text-center text-sm text-muted py-10">불러오는 중...</p>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-3xl">💬</span>
              <p className="text-sm text-muted">첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : comments.map(c => {
            const name = c.user?.name ?? c.user?.nickname ?? '알 수 없음'
            const isMine = c.user?.id === currentUserId
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                  style={{ background: 'var(--purple)' }}>{name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-900">{name}</span>
                    <span className="text-[10px] text-muted">{formatDate(c.created_at)}</span>
                    {(isMine || isAdmin) && (
                      <button onClick={() => del(c.id)} className="text-[10px] text-red-300 hover:text-red-500 ml-auto">삭제</button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{c.text}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center gap-2 shrink-0">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="댓글을 입력하세요..." className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm outline-none"
            style={{ border: '1px solid var(--border)' }} />
          <button onClick={submit} disabled={!text.trim() || sending}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ background: 'var(--purple)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" /></svg>
          </button>
        </div>
      </div>
    </>
  )
}

function PostCard({ post, currentUserId, isAdmin, onDelete, onReact }: {
  post: Post; currentUserId: string; isAdmin?: boolean
  onDelete: (id: string) => void; onReact: (id: string, emoji: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const isMine = post.author?.id === currentUserId
  const name = post.author?.name ?? post.author?.nickname ?? '알 수 없음'
  const isLong = post.content.length > 200
  const displayContent = isLong && !expanded ? post.content.slice(0, 200) + '…' : post.content

  async function handleDelete() {
    if (!confirm('이 게시물을 삭제할까요?')) return
    const res = await fetch(`/api/sapjil/${post.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(post.id)
  }

  return (
    <>
      <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-gray-900 text-sm leading-snug flex-1">{post.title}</h3>
            {(isMine || isAdmin) && (
              <button onClick={handleDelete} className="text-[10px] text-red-300 hover:text-red-500 shrink-0 mt-0.5">삭제</button>
            )}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: 'var(--purple)' }}>{name.charAt(0)}</div>
            <span className="text-xs text-gray-600 font-medium">{name}</span>
            <span className="text-[10px] text-muted">{formatDate(post.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{displayContent}</p>
          {isLong && (
            <button onClick={() => setExpanded(v => !v)} className="text-xs font-medium mt-1" style={{ color: 'var(--purple)' }}>
              {expanded ? '접기' : '더 보기'}
            </button>
          )}
          {post.image_url && (
            <img src={post.image_url} alt="첨부 이미지"
              className="mt-3 w-full rounded-xl object-cover cursor-pointer"
              style={{ maxHeight: 280 }}
              onClick={() => window.open(post.image_url!, '_blank')}
            />
          )}
        </div>
        <div className="px-4 py-2.5 flex items-center gap-2 border-t border-border/50">
          {/* Reactions */}
          {!isMine && (
            <div className="flex items-center gap-1 flex-wrap flex-1">
              {QUICK_EMOJIS.map(emoji => {
                const r = post.reactions.find(rx => rx.emoji === emoji)
                const count = r?.count ?? 0; const mine = r?.mine ?? false
                return (
                  <button key={emoji} onClick={() => onReact(post.id, emoji)}
                    className="flex items-center gap-0.5 rounded-full transition-all active:scale-95"
                    style={{
                      padding: count > 0 ? '3px 8px' : '3px 6px',
                      border: mine ? '1.5px solid var(--purple)' : '1px solid var(--border)',
                      background: mine ? 'var(--purple-light)' : '#FAF9F8', fontSize: 13,
                    }}>
                    <span>{emoji}</span>
                    {count > 0 && <span className="text-[11px] font-semibold ml-0.5" style={{ color: mine ? 'var(--purple)' : '#6B7280' }}>{count}</span>}
                  </button>
                )
              })}
            </div>
          )}
          {isMine && post.reactions.filter(r => r.count > 0).length > 0 && (
            <div className="flex items-center gap-1 flex-wrap flex-1">
              {post.reactions.filter(r => r.count > 0).map(r => (
                <span key={r.emoji} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-xs" style={{ border: '1px solid var(--border)' }}>
                  {r.emoji} <span className="font-semibold text-muted">{r.count}</span>
                </span>
              ))}
            </div>
          )}
          {isMine && post.reactions.filter(r => r.count > 0).length === 0 && <div className="flex-1" />}
          {/* Comment button */}
          <button onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0"
            style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid var(--border)' }}>
            💬 {commentCount > 0 ? commentCount : '댓글'}
          </button>
        </div>
      </div>
      <CommentDrawer
        postId={post.id}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCountChange={setCommentCount}
      />
    </>
  )
}

function NewPostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (post: Post) => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
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
    fd.append('type', 'sapjil')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (res.ok) { const { url } = await res.json(); setImageUrl(url) }
    else setError('이미지 업로드 실패')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) { setError('제목과 내용을 모두 입력해주세요'); return }
    setSubmitting(true); setError('')
    const res = await fetch('/api/sapjil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), content: content.trim(), image_url: imageUrl }),
    })
    const data = await res.json()
    if (res.ok) { onCreated(data); onClose() }
    else setError(data.error ?? '오류가 발생했습니다')
    setSubmitting(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[59] bg-black/30" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '90vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h3 className="font-bold text-gray-900">새 삽질기 등록</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted text-lg rounded-full hover:bg-gray-100">✕</button>
        </div>
        {/* Scrollable form including submit button */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-5 py-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">제목 <span className="text-red-400">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="어떤 문제를 만났나요? (한 줄로)"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">내용 <span className="text-red-400">*</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="문제 상황, 시도한 것들, 최종 해결책을 자유롭게 써주세요 😊"
                rows={6}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none leading-relaxed"
                style={{ border: '1px solid var(--border)', background: '#FAF9F8' }} />
            </div>
            {/* Image upload */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">이미지 첨부 (선택)</label>
              {imageUrl ? (
                <div className="relative inline-block">
                  <img src={imageUrl} alt="미리보기" className="h-32 w-auto rounded-xl object-cover" style={{ border: '1px solid var(--border)' }} />
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
            {/* Submit button inside scroll area so it's always reachable */}
            <button onClick={handleSubmit}
              disabled={submitting || !title.trim() || !content.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-opacity"
              style={{ background: '#6366F1' }}>
              {submitting ? '등록 중...' : '등록하기'}
            </button>
            <div className="h-4" /> {/* bottom spacing */}
          </div>
        </div>
      </div>
    </>
  )
}

export default function SapjilClient({ initialPosts, currentUserId, isAdmin }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [showModal, setShowModal] = useState(false)

  function handleDelete(id: string) { setPosts(prev => prev.filter(p => p.id !== id)) }
  function handleCreated(post: Post) { setPosts(prev => [post, ...prev]) }

  async function handleReact(postId: string, emoji: string) {
    const res = await fetch(`/api/sapjil/${postId}/react`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    if (!res.ok) return
    const json = await res.json()
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      let reactions = [...p.reactions]
      if (json.previousEmoji) {
        reactions = reactions.map(r =>
          r.emoji === json.previousEmoji ? { ...r, count: Math.max(0, r.count - 1), mine: false } : r
        ).filter(r => r.count > 0)
      }
      const idx = reactions.findIndex(r => r.emoji === emoji)
      if (json.reacted) {
        if (idx >= 0) reactions[idx] = { ...reactions[idx], count: reactions[idx].count + 1, mine: true }
        else reactions.push({ emoji, count: 1, mine: true })
      } else {
        if (idx >= 0) {
          const c = reactions[idx].count - 1
          if (c <= 0) reactions.splice(idx, 1)
          else reactions[idx] = { ...reactions[idx], count: c, mine: false }
        }
      }
      return { ...p, reactions }
    }))
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="px-4 py-3 bg-white border-b border-border">
        <button onClick={() => setShowModal(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE' }}>
          <span className="text-base">✏️</span>
          나의 삽질기 공유하기
        </button>
      </div>
      <div className="px-4 py-4 flex flex-col gap-3">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">🔧</span>
            <p className="text-sm font-semibold text-gray-700">첫 번째 삽질기를 공유해보세요!</p>
            <p className="text-xs text-muted text-center leading-relaxed">AI 쓰다가 막힌 것, 해결한 것, 배운 것<br />모두 환영합니다</p>
          </div>
        ) : posts.map(post => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} isAdmin={isAdmin}
            onDelete={handleDelete} onReact={handleReact} />
        ))}
      </div>
      {showModal && <NewPostModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  )
}
