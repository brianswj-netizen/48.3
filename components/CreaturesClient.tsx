'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import ImageUpload from './ImageUpload'

type Reaction = { emoji: string; count: number; mine: boolean }
type Comment = {
  id: string; text: string; created_at: string
  user: { id: string; name: string | null; nickname: string | null } | null
}
type Post = {
  id: string; title: string; description: string | null; url: string | null
  image_url: string | null; created_at: string
  author: { id: string; name: string | null; nickname: string | null; avatar_url: string | null } | null
  reactions: Reaction[]
  comment_count: number
}

const QUICK_EMOJIS = ['❤️', '🔥', '👍', '🤩', '💡', '🙏']

function formatDate(iso: string) {
  const d = new Date(iso), diff = Date.now() - d.getTime()
  if (diff < 60_000) return '방금'
  if (diff < 3_600_000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86_400_000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function parseComment(text: string) {
  const lines = text.split('\n')
  const imageUrls = lines.filter(l => l.startsWith('__IMAGE__:')).map(l => l.replace('__IMAGE__:', ''))
  const textPart = lines.filter(l => !l.startsWith('__IMAGE__:')).join('\n').trim()
  return { textPart, imageUrls }
}

function CommentDrawer({ postId, currentUserId, isAdmin, isOpen, onClose, onCountChange }: {
  postId: string; currentUserId: string; isAdmin?: boolean
  isOpen: boolean; onClose: () => void; onCountChange?: (n: number) => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadComments = async () => {
    setLoading(true)
    const r = await fetch(`/api/creatures/${postId}/comments`)
    const d = await r.json()
    if (Array.isArray(d)) { setComments(d); onCountChange?.(d.length) }
    setLoading(false)
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'comment')
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) { const { url } = await res.json(); setImageUrl(url) }
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const submit = async () => {
    if (!text.trim() && !imageUrl) return
    if (sending) return
    setSending(true)
    const combined = [text.trim(), imageUrl ? `__IMAGE__:${imageUrl}` : ''].filter(Boolean).join('\n')
    const res = await fetch(`/api/creatures/${postId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: combined }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments(p => { const n = [...p, c]; onCountChange?.(n.length); return n })
      setText(''); setImageUrl(null)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSending(false)
  }

  const del = async (cid: string) => {
    const res = await fetch(`/api/creatures/${postId}/comments?id=${cid}`, { method: 'DELETE' })
    if (res.ok) setComments(p => { const n = p.filter(c => c.id !== cid); onCountChange?.(n.length); return n })
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // Load on open
  const wasOpen = useRef(false)
  if (isOpen && !wasOpen.current) { wasOpen.current = true; loadComments() }
  if (!isOpen) { wasOpen.current = false }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[59] bg-black/30" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '75vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h3 className="font-bold text-sm text-gray-900">댓글{comments.length > 0 ? ` ${comments.length}` : ''}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted text-lg rounded-full hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3 min-h-0">
          {loading && <p className="text-xs text-muted text-center py-4">불러오는 중...</p>}
          {!loading && comments.length === 0 && <p className="text-xs text-muted text-center py-4">첫 댓글을 남겨보세요!</p>}
          {comments.map(c => {
            const u = Array.isArray(c.user) ? (c.user as any)[0] : c.user
            const name = u?.name ?? u?.nickname ?? '?'
            const { textPart, imageUrls } = parseComment(c.text)
            return (
              <div key={c.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: '#BE185D' }}>{name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-800">{name}</span>
                    <span className="text-[10px] text-muted">{formatDate(c.created_at)}</span>
                    {(isAdmin || (c.user as any)?.id === currentUserId) && (
                      <button onClick={() => del(c.id)} className="text-[10px] text-red-300 hover:text-red-500 ml-auto">삭제</button>
                    )}
                  </div>
                  {textPart && <p className="text-xs text-gray-700 mt-0.5 leading-relaxed whitespace-pre-wrap">{textPart}</p>}
                  {imageUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="첨부 이미지"
                      className="mt-1.5 rounded-xl max-w-full object-cover cursor-pointer"
                      style={{ maxHeight: 200 }}
                      onClick={() => window.open(url, '_blank')} />
                  ))}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        {/* 입력 영역 */}
        <div className="px-4 pt-2 pb-3 border-t border-border shrink-0 flex flex-col gap-2">
          {/* 이미지 미리보기 */}
          {imageUrl && (
            <div className="relative w-20 h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="미리보기" className="w-full h-full object-cover rounded-xl" />
              <button onClick={() => setImageUrl(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white text-[10px] flex items-center justify-center">✕</button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            {/* 이미지 첨부 버튼 */}
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-gray-100 transition-colors"
              style={{ border: '1px solid var(--border)' }}>
              {uploading
                ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ccc" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#BE185D" strokeWidth="3" strokeLinecap="round"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#9CA3AF" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="#9CA3AF"/><path d="M21 15L16 10L11 15M16 15L13 12" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
            </button>
            {/* 텍스트 입력 */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => { setText(e.target.value); autoResize(e.target) }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() } }}
              placeholder="댓글을 입력하세요… (Ctrl+Enter로 전송)"
              rows={1}
              className="flex-1 text-sm border border-border rounded-2xl px-3 py-2 outline-none resize-none leading-relaxed focus:border-pink-400"
              style={{ minHeight: 38, maxHeight: 120 }}
            />
            {/* 전송 */}
            <button onClick={submit} disabled={(!text.trim() && !imageUrl) || sending}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
              style={{ background: '#BE185D' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2 21L23 12L2 3V10L17 12L2 14V21Z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: (post: Post) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/creatures', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, url, image_url: imageUrl }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? '저장 실패'); return }
    onSaved(json); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] flex flex-col"
        style={{ maxHeight: '85dvh' }} onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-base font-black text-gray-900">🛸 피조물 등록</h2>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-3 flex flex-col gap-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="앱/도구 이름" maxLength={100}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-pink-500" />
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="어떤 걸 만들었는지 소개해주세요" maxLength={500}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-pink-500 resize-none h-24" />
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="링크 (선택사항, https://...)" maxLength={500}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-pink-500" />
          <ImageUpload value={imageUrl} onChange={setImageUrl} uploadType="announcement" />
        </div>
        <div className="px-5 pb-6 pt-3 border-t border-border shrink-0 flex gap-2"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border text-gray-600">취소</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#BE185D' }}>
            {saving ? '저장 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CreaturesClient({ initialPosts, currentUserId, isAdmin }: {
  initialPosts: Post[]; currentUserId: string; isAdmin?: boolean
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [showCreate, setShowCreate] = useState(false)
  const [openComments, setOpenComments] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(initialPosts.map(p => [p.id, p.comment_count]))
  )
  const [emojiPicker, setEmojiPicker] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [reactorPopover, setReactorPopover] = useState<{ postId: string; emoji: string } | null>(null)

  async function handleReact(postId: string, emoji: string) {
    const res = await fetch(`/api/creatures/${postId}/react`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    if (!res.ok) return
    const json = await res.json()
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const current = [...p.reactions]
      if (json.previousEmoji && json.previousEmoji !== emoji) {
        const idx = current.findIndex(r => r.emoji === json.previousEmoji)
        if (idx >= 0) {
          if (current[idx].count <= 1) current.splice(idx, 1)
          else current[idx] = { ...current[idx], count: current[idx].count - 1, mine: false }
        }
      }
      const idx = current.findIndex(r => r.emoji === emoji)
      if (json.reacted) {
        if (idx >= 0) current[idx] = { ...current[idx], count: current[idx].count + 1, mine: true }
        else current.push({ emoji, count: 1, mine: true })
      } else {
        if (idx >= 0) {
          if (current[idx].count <= 1) current.splice(idx, 1)
          else current[idx] = { ...current[idx], count: current[idx].count - 1, mine: false }
        }
      }
      return { ...p, reactions: current }
    }))
    setEmojiPicker(null)
  }

  async function handleDelete(postId: string) {
    if (!confirm('피조물을 삭제할까요?')) return
    const res = await fetch(`/api/creatures/${postId}`, { method: 'DELETE' })
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <div className="flex flex-col min-h-full pb-28">
      <div className="px-4 py-4 flex flex-col gap-4">
        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🛸</p>
            <p className="text-sm font-semibold text-gray-700">아직 피조물이 없습니다</p>
            <p className="text-xs text-muted mt-1">첫 번째 피조물을 공개해보세요!</p>
          </div>
        )}

        {posts.map(post => {
          const authorRaw = post.author as any
          const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw
          const authorName = author?.name ?? author?.nickname ?? '?'
          const isAuthor = post.author && (Array.isArray(post.author) ? (post.author as any)[0]?.id : (post.author as any)?.id) === currentUserId
          const showEmoji = emojiPicker === post.id

          return (
            <div key={post.id} className="bg-white rounded-[16px] overflow-hidden"
              style={{ border: '0.5px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

              {/* 이미지 */}
              {post.image_url && (
                <div className="w-full aspect-video bg-gray-100 overflow-hidden">
                  <Image src={post.image_url} alt={post.title} width={600} height={338}
                    className="w-full h-full object-cover" />
                </div>
              )}

              <div className="px-4 py-4">
                {/* 제목 + 링크 */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-gray-900 leading-snug">{post.title}</p>
                    {post.url && (
                      <a href={post.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs mt-0.5 truncate block hover:underline"
                        style={{ color: '#BE185D' }}>
                        🔗 {post.url.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                  {(isAuthor || isAdmin) && (
                    <button onClick={() => handleDelete(post.id)}
                      className="text-muted hover:text-red-400 text-sm shrink-0 p-1">🗑</button>
                  )}
                </div>

                {/* 설명 */}
                {post.description && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{post.description}</p>
                )}

                {/* 작성자 + 날짜 */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: '#BE185D' }}>{authorName.charAt(0)}</div>
                  <span className="text-xs text-muted">{authorName} · {formatDate(post.created_at)}</span>
                </div>

                {/* 이모지 반응 + 댓글 버튼 */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {post.reactions.map(r => (
                    <button key={r.emoji}
                      onClick={() => handleReact(post.id, r.emoji)}
                      onPointerDown={() => {
                        longPressTimer.current = setTimeout(() => setReactorPopover({ postId: post.id, emoji: r.emoji }), 500)
                      }}
                      onPointerUp={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null } }}
                      onPointerLeave={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null } }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold select-none"
                      style={r.mine
                        ? { background: '#BE185D', color: 'white' }
                        : { background: '#FDF2F8', color: '#BE185D' }}>
                      {r.emoji} {r.count}
                    </button>
                  ))}

                  {/* 이모지 추가 버튼 */}
                  <div className="relative">
                    <button onClick={() => setEmojiPicker(showEmoji ? null : post.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: '#FDF2F8', color: '#BE185D' }}>
                      😊 +
                    </button>
                    {showEmoji && (
                      <div className="absolute bottom-8 left-0 z-10 bg-white rounded-2xl shadow-lg border border-border p-2 flex gap-1.5 flex-wrap"
                        style={{ width: 160 }}>
                        {QUICK_EMOJIS.map(e => (
                          <button key={e} onClick={() => handleReact(post.id, e)}
                            className="text-xl hover:scale-125 transition-transform">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 댓글 버튼 */}
                  <button onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={openComments === post.id
                      ? { background: '#BE185D', color: 'white' }
                      : { background: '#F3F4F6', color: '#6B7280' }}>
                    💬 {commentCounts[post.id] ?? 0}
                  </button>
                </div>
              </div>

              {/* 댓글 드로어 */}
              <CommentDrawer
                postId={post.id}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                isOpen={openComments === post.id}
                onClose={() => setOpenComments(null)}
                onCountChange={n => setCommentCounts(prev => ({ ...prev, [post.id]: n }))}
              />
            </div>
          )
        })}
      </div>

      {/* 반응자 팝오버 */}
      {reactorPopover && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setReactorPopover(null)}>
          <div className="bg-white rounded-2xl p-5 mx-6 w-full max-w-xs shadow-xl"
            onClick={e => e.stopPropagation()}>
            <p className="text-center text-2xl mb-3">{reactorPopover.emoji}</p>
            <p className="text-xs text-muted text-center">이 반응을 남긴 사람</p>
            <div className="mt-2 flex flex-col gap-2">
              {posts.find(p => p.id === reactorPopover.postId)
                ?.reactions.find(r => r.emoji === reactorPopover.emoji)
                ? <p className="text-sm text-center text-gray-500">
                    {posts.find(p => p.id === reactorPopover.postId)
                      ?.reactions.find(r => r.emoji === reactorPopover.emoji)?.count ?? 0}명이 반응했어요
                  </p>
                : null}
            </div>
            <button onClick={() => setReactorPopover(null)}
              className="mt-4 w-full py-2 rounded-xl text-sm font-semibold text-muted bg-gray-100">닫기</button>
          </div>
        </div>
      )}

      {/* 등록 버튼 */}
      <button onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-4 flex items-center gap-2 px-4 h-12 rounded-full text-white text-sm font-bold shadow-lg md:bottom-8"
        style={{ background: '#BE185D' }}>
        <span className="text-lg">+</span> 피조물 등록
      </button>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSaved={post => setPosts(prev => [post, ...prev])}
        />
      )}
    </div>
  )
}
