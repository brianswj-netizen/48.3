'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import MentionCommentInput, { type MemberOption } from './MentionCommentInput'
import MentionText from './MentionText'
import ImageUpload from './ImageUpload'

type Announcement = {
  id: string
  title: string
  content: string
  image_url?: string | null
  created_at: string
  author_id?: string | null
  authorName: string
  reactions: Record<string, { count: number; reacted: boolean }>
}

type Comment = {
  id: string
  text: string
  created_at: string
  author_id: string
  author: { name: string | null; nickname: string | null } | null
}

const EMOJIS = ['👍', '❤️', '😮', '😂'] as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCommentTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return '방금'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M3 6H21M8 6V4H16V6M19 6L18 20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20L5 6"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 11V17M14 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 19V12"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── 댓글 섹션 ───
function AnnCommentSection({
  announcementId,
  currentUserId,
  currentUserName,
  isAdmin,
  members,
}: {
  announcementId: string
  currentUserId: string | null
  currentUserName?: string | null
  isAdmin: boolean
  members?: MemberOption[]
}) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [postError, setPostError] = useState('')

  async function loadComments() {
    setLoading(true)
    const res = await fetch(`/api/announcements/${announcementId}/comments`)
    const data = await res.json()
    setLoading(false)
    if (Array.isArray(data)) setComments(data)
    else setComments([])
  }

  async function deleteComment(commentId: string) {
    if (!confirm('댓글을 삭제할까요?')) return
    const res = await fetch(`/api/announcements/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) setComments(prev => (prev ?? []).filter(c => c.id !== commentId))
  }

  async function postComment(text: string) {
    setPostError('')
    try {
      const res = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json = await res.json()
      if (!res.ok) setPostError(json.error ?? '등록 실패. 잠시 후 다시 시도해주세요.')
      else setComments(prev => [...(prev ?? []), json])
    } catch {
      setPostError('네트워크 오류. 다시 시도해주세요.')
    }
  }

  // Auto-load when mounted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadComments() }, [announcementId])

  const canComment = !!currentUserId

  return (
    <div className="mt-3 pt-3 border-t border-border/60 flex flex-col gap-2">
      {loading && <p className="text-xs text-muted text-center py-2">불러오는 중...</p>}

      {comments && comments.length === 0 && (
        <p className="text-xs text-muted text-center py-1">아직 댓글이 없습니다.</p>
      )}

      {comments && comments.map(c => {
        const authorRaw = c.author as any
        const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw
        const name = author?.name ?? author?.nickname ?? '알 수 없음'
        return (
          <div key={c.id} className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: '#E07B54' }}
            >
              {name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-gray-800">{name}</span>
                <span className="text-[10px] text-muted">{formatCommentTime(c.created_at)}</span>
                {(isAdmin || c.author_id === currentUserId) && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-[10px] text-red-300 hover:text-red-500 ml-auto"
                  >
                    삭제
                  </button>
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
          <MentionCommentInput
            onSend={postComment}
            placeholder="댓글을 남겨주세요... (@이름으로 멘션)"
            members={members}
          />
        </div>
      )}
    </div>
  )
}

export default function AnnouncementsClient({
  initialItems,
  isAdmin,
  currentUserId,
  currentUserName,
  members = [],
}: {
  initialItems: Announcement[]
  isAdmin: boolean
  currentUserId: string | null
  currentUserName?: string | null
  members?: MemberOption[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(
    initialItems.length === 1 ? initialItems[0].id : null
  )
  // Per-announcement reaction state: Record<announcementId, Record<emoji, {count, reacted}>>
  const [allReactions, setAllReactions] = useState<
    Record<string, Record<string, { count: number; reacted: boolean }>>
  >(() => Object.fromEntries(initialItems.map(item => [item.id, item.reactions ?? {}])))

  function toggleExpand(id: string) {
    setExpanded(prev => (prev === id ? null : id))
  }

  async function handleDelete(id: string) {
    if (!confirm('이 공지사항을 삭제할까요?')) return
    setDeleting(id)
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      setItems(prev => prev.filter(item => item.id !== id))
      router.refresh()
    }
  }

  function startEdit(item: Announcement) {
    setEditing(item.id)
    setEditTitle(item.title)
    setEditContent(item.content)
    setEditImageUrl(item.image_url ?? null)
  }

  function cancelEdit() {
    setEditing(null)
    setEditTitle('')
    setEditContent('')
    setEditImageUrl(null)
  }

  async function handleSave(id: string) {
    if (!editTitle.trim() || !editContent.trim()) return
    setSaving(true)
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, content: editContent, image_url: editImageUrl }),
    })
    setSaving(false)
    if (res.ok) {
      setItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, title: editTitle, content: editContent, image_url: editImageUrl } : item
        )
      )
      cancelEdit()
      router.refresh()
    }
  }

  async function handleReact(announcementId: string, emoji: string) {
    if (!currentUserId) return
    const res = await fetch(`/api/announcements/${announcementId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    if (!res.ok) return
    const json = await res.json() // { reacted, emoji, previousEmoji }

    setAllReactions(prev => {
      const current = { ...(prev[announcementId] ?? {}) }

      // 이전 이모지가 다른 것이었다면 카운트 차감
      if (json.previousEmoji && json.previousEmoji !== emoji) {
        const prevData = current[json.previousEmoji]
        if (prevData) {
          const newCount = prevData.count - 1
          if (newCount <= 0) delete current[json.previousEmoji]
          else current[json.previousEmoji] = { count: newCount, reacted: false }
        }
      }

      // 현재 이모지 업데이트
      const existing = current[emoji] ?? { count: 0, reacted: false }
      if (json.reacted) {
        current[emoji] = { count: existing.count + 1, reacted: true }
      } else {
        const newCount = existing.count - 1
        if (newCount <= 0) delete current[emoji]
        else current[emoji] = { count: newCount, reacted: false }
      }
      return { ...prev, [announcementId]: current }
    })
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 flex items-center justify-between"
        style={{ background: '#E07B54' }}>
        <h1 className="text-xl font-black text-white">공지사항</h1>
        {isAdmin && (
          <Link
            href="/announcements/new"
            className="text-sm font-semibold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
          >
            + 작성
          </Link>
        )}
      </header>

      <div className="px-4 py-4 flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-sm">아직 공지사항이 없습니다.</p>
          </div>
        ) : (
          items.map((item) => {
            const reactions = allReactions[item.id] ?? {}
            return (
              <div
                key={item.id}
                className="bg-white rounded-[14px] px-4 py-4"
                style={{ border: '0.5px solid var(--border)' }}
              >
                {editing === item.id ? (
                  /* ── 수정 모드 ── */
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      maxLength={100}
                      placeholder="제목"
                      className="w-full text-sm font-semibold text-gray-900 border border-border rounded-xl px-3 py-2 outline-none focus:border-purple-400 transition-colors"
                    />
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      maxLength={2000}
                      rows={5}
                      placeholder="내용"
                      className="w-full text-sm text-gray-700 border border-border rounded-xl px-3 py-2 outline-none focus:border-purple-400 transition-colors resize-none leading-relaxed"
                    />
                    <ImageUpload value={editImageUrl} onChange={setEditImageUrl} uploadType="announcement" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={saving || !editTitle.trim() || !editContent.trim()}
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ background: 'var(--purple)' }}
                      >
                        {saving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-muted bg-gray-100 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── 보기 모드 ── */
                  <>
                    {/* 항목 헤더 — 클릭으로 펼치기/접기 */}
                    <div
                      className="flex items-center justify-between gap-2 cursor-pointer"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-snug">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted">{item.authorName}</span>
                          <span className="text-xs text-muted">{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isAdmin && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); startEdit(item) }}
                              disabled={!!deleting}
                              className="text-muted hover:text-blue-500 transition-colors p-2 disabled:opacity-40 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                              disabled={deleting === item.id}
                              className="text-muted hover:text-red-500 transition-colors p-2 disabled:opacity-40 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            >
                              <TrashIcon />
                            </button>
                          </>
                        )}
                        <div
                          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200 text-base font-bold"
                          style={{
                            transform: expanded === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: '#E07B54',
                          }}
                          aria-label="펼치기/접기"
                        >
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* 펼쳐진 내용 */}
                    {expanded === item.id && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                        {item.image_url && (
                          <div className="mt-3 rounded-xl overflow-hidden">
                            <Image src={item.image_url} alt="첨부 이미지" width={600} height={400} className="w-full object-cover" />
                          </div>
                        )}

                        {/* 이모지 리액션 바 */}
                        {(() => {
                          const isSelf = !!(currentUserId && item.author_id && currentUserId === item.author_id)
                          const hasReactions = EMOJIS.some(e => (reactions[e]?.count ?? 0) > 0)
                          // 본인 글이고 리액션도 없으면 바 자체를 숨김
                          if (isSelf && !hasReactions) return null
                          return (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {EMOJIS.map(emoji => {
                                const r = reactions[emoji]
                                const reacted = r?.reacted ?? false
                                const count = r?.count ?? 0
                                // 본인 글: 리액션 있는 것만 표시 (클릭 불가)
                                if (isSelf && count === 0) return null
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => !isSelf && handleReact(item.id, emoji)}
                                    disabled={isSelf}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors disabled:cursor-default"
                                    style={
                                      reacted
                                        ? { background: '#E07B54', color: 'white' }
                                        : { background: '#FDF0EB', color: '#E07B54' }
                                    }
                                  >
                                    <span>{emoji}</span>
                                    {count > 0 && <span>{count}</span>}
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })()}

                        {/* 댓글 섹션 */}
                        <AnnCommentSection
                          announcementId={item.id}
                          currentUserId={currentUserId}
                          currentUserName={currentUserName}
                          isAdmin={isAdmin}
                          members={members}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
