'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import MentionCommentInput, { type MemberOption } from './MentionCommentInput'
import MentionText from './MentionText'
import ImageUpload from './ImageUpload'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

type Event = {
  id: string
  title: string
  place: string | null
  notes: string | null
  event_date: string
  event_time: string | null
  created_by: string | null
  image_url: string | null
}

type VoteDeadline = {
  id: string
  title: string
  deadline: string | null
}

function ddayLabel(deadline: string | null) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return '마감'
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
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

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(first).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

function formatTime(time: string | null) {
  if (!time) return ''
  return time.slice(0, 5)
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

type EventComment = {
  id: string
  text: string
  created_at: string
  author_id: string
  author: { name: string | null; nickname: string | null } | null
}

function formatCommentTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return '방금'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function EventCommentSection({ eventId, currentUserId, currentUserName, isAdmin, members }: { eventId: string; currentUserId: string | null; currentUserName?: string | null; isAdmin: boolean; members?: MemberOption[] }) {
  const [comments, setComments] = useState<EventComment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [postError, setPostError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/comments`)
      const data = await res.json()
      setLoading(false)
      setComments(Array.isArray(data) ? data : [])
    }
    load()
  }, [eventId])

  async function postComment(text: string) {
    setPostError('')
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json = await res.json()
      if (!res.ok) setPostError(json.error ?? '등록 실패')
      else setComments(prev => [...(prev ?? []), json])
    } catch {
      setPostError('네트워크 오류')
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('댓글을 삭제할까요?')) return
    const res = await fetch(`/api/events/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) setComments(prev => (prev ?? []).filter(c => c.id !== commentId))
  }

  return (
    <div className="flex flex-col gap-2">
      {loading && <p className="text-xs text-muted text-center py-1">불러오는 중...</p>}
      {comments && comments.length === 0 && !loading && (
        <p className="text-xs text-muted text-center py-1">아직 댓글이 없습니다.</p>
      )}
      {comments && comments.map(c => {
        const authorRaw = c.author as any
        const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw
        const name = author?.name ?? author?.nickname ?? '알 수 없음'
        return (
          <div key={c.id} className="flex gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: '#A8BCCE' }}>
              {name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-gray-800">{name}</span>
                <span className="text-[10px] text-muted">{formatCommentTime(c.created_at)}</span>
                {(isAdmin || c.author_id === currentUserId) && (
                  <button onClick={() => deleteComment(c.id)} className="text-[10px] text-red-300 hover:text-red-500 ml-auto">삭제</button>
                )}
              </div>
              <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
                <MentionText text={c.text} currentUserName={currentUserName} />
              </p>
            </div>
          </div>
        )
      })}
      {postError && <p className="text-[11px] text-red-500">{postError}</p>}
      {currentUserId && (
        <div className="mt-1">
          <MentionCommentInput
            onSend={postComment}
            placeholder="댓글을 입력하세요... (@이름으로 멘션)"
            members={members}
          />
        </div>
      )}
    </div>
  )
}

function EventDetailModal({
  event,
  isAdmin,
  currentUserId,
  currentUserName,
  members,
  onClose,
  onUpdate,
  onDelete,
}: {
  event: Event
  isAdmin: boolean
  currentUserId?: string | null
  currentUserName?: string | null
  members?: MemberOption[]
  onClose: () => void
  onUpdate: (updated: Event) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: event.title,
    place: event.place ?? '',
    event_date: event.event_date,
    event_time: event.event_time ?? '',
    notes: event.notes ?? '',
  })
  const [editImageUrl, setEditImageUrl] = useState<string | null>(event.image_url)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, image_url: editImageUrl }),
      })
      const json = await res.json()
      if (res.ok) {
        onUpdate({ ...event, ...json })
        setEditing(false)
      } else {
        setSaveError(json.error ?? '저장에 실패했습니다.')
      }
    } catch {
      setSaveError('네트워크 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('이 일정을 삭제할까요?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(event.id)
        onClose()
      } else {
        const json = await res.json()
        alert(json.error ?? '삭제에 실패했습니다.')
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const d = new Date(event.event_date)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[24px] flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center min-w-[40px] py-1 px-2 rounded-xl" style={{ background: '#EFF4F8' }}>
              <span className="text-[10px] font-medium text-muted leading-none">{d.getMonth() + 1}월</span>
              <span className="text-2xl font-black leading-tight" style={{ color: '#A8BCCE' }}>{d.getDate()}</span>
              <span className="text-[10px] text-muted leading-none">{DAYS[d.getDay()]}</span>
            </div>
            {editing ? (
              <input
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="text-base font-bold text-gray-900 border border-border rounded-xl px-3 py-1.5 outline-none focus:border-blue-400"
              />
            ) : (
              <div>
                <p className="text-base font-bold text-gray-900 leading-snug">{event.title}</p>
                {event.event_time && (
                  <p className="text-xs text-muted mt-0.5">🕐 {formatTime(event.event_time)}</p>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-muted text-2xl leading-none ml-2">×</button>
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {/* 편집 폼 */}
          {editing && (
            <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <input
                value={editForm.place}
                onChange={e => setEditForm(f => ({ ...f, place: e.target.value }))}
                placeholder="장소"
                className="text-sm border border-border rounded-lg px-3 py-1.5 outline-none"
              />
              <div className="flex gap-2">
                <input type="date" value={editForm.event_date} onChange={e => setEditForm(f => ({ ...f, event_date: e.target.value }))}
                  className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 outline-none" />
                <input type="time" value={editForm.event_time} onChange={e => setEditForm(f => ({ ...f, event_time: e.target.value }))}
                  className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 outline-none" />
              </div>
              <textarea
                value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="메모"
                rows={3}
                className="text-sm border border-border rounded-lg px-3 py-1.5 outline-none resize-none"
              />
              <ImageUpload value={editImageUrl} onChange={setEditImageUrl} uploadType="event" />
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#A8BCCE' }}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100">
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 상세 정보 */}
          {!editing && (
            <div className="flex flex-col gap-2">
              {event.place && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="shrink-0">📍</span>
                  <span>{event.place}</span>
                </div>
              )}
              {event.event_time && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="shrink-0">🕐</span>
                  <span>{formatFullDate(event.event_date)} {formatTime(event.event_time)}</span>
                </div>
              )}
              {!event.event_time && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="shrink-0">📅</span>
                  <span>{formatFullDate(event.event_date)}</span>
                </div>
              )}
              {event.notes && (
                <div className="mt-1 p-3 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ background: '#F8F9FA' }}>
                  {event.notes}
                </div>
              )}
              {event.image_url && (
                <div className="mt-1 rounded-xl overflow-hidden">
                  <Image src={event.image_url} alt="첨부 이미지" width={600} height={400} className="w-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* 댓글 */}
          <div>
            <p className="text-xs font-semibold text-muted mb-2">💬 댓글</p>
            <EventCommentSection
              eventId={event.id}
              currentUserId={currentUserId ?? null}
              currentUserName={currentUserName}
              isAdmin={isAdmin}
              members={members}
            />
          </div>
        </div>

        {/* 수정/삭제 버튼 (작성자 또는 어드민) */}
        {!editing && (isAdmin || event.created_by === currentUserId) && (
          <div className="px-5 py-4 border-t border-border flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#EFF4F8', color: '#5B8FA8' }}
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#DC2626' }}
            >
              {deleting ? '삭제 중...' : '🗑 삭제'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalendarClient({
  events: initialEvents,
  votes = [],
  isAdmin,
  currentUserId,
  currentUserName,
  members = [],
}: {
  events: Event[]
  votes?: VoteDeadline[]
  isAdmin: boolean
  currentUserId?: string | null
  currentUserName?: string | null
  members?: MemberOption[]
}) {
  const router = useRouter()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState(initialEvents)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  function toggleDay(day: number) {
    setSelectedDay(prev => (prev === day ? null : day))
  }

  const cells = buildCalendar(year, month)

  const eventDays = new Set(
    events
      .filter((e) => {
        const d = new Date(e.event_date)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .map((e) => new Date(e.event_date).getDate())
  )

  const voteDays = new Set(
    votes
      .filter((v) => {
        if (!v.deadline) return false
        const d = new Date(v.deadline)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .map((v) => new Date(v.deadline!).getDate())
  )

  const monthEvents = events
    .filter((e) => {
      const d = new Date(e.event_date)
      if (d.getFullYear() !== year || d.getMonth() !== month) return false
      if (selectedDay !== null && d.getDate() !== selectedDay) return false
      return true
    })
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  const monthVotes = votes
    .filter((v) => {
      if (!v.deadline) return false
      const d = new Date(v.deadline)
      if (d.getFullYear() !== year || d.getMonth() !== month) return false
      if (selectedDay !== null && d.getDate() !== selectedDay) return false
      return true
    })
    .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))

  const pastEvents = events
    .filter(e => e.event_date < todayStr)
    .sort((a, b) => b.event_date.localeCompare(a.event_date))

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function handleEventUpdate(updated: Event) {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
    setSelectedEvent(updated)
    router.refresh()
  }

  function handleEventDelete(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id))
    setSelectedEvent(null)
    router.refresh()
  }

  function EventCard({ event, isPast = false }: { event: Event; isPast?: boolean }) {
    const d = new Date(event.event_date)
    return (
      <div
        className={`bg-white rounded-[14px] px-4 py-3 flex items-start gap-4 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100 ${isPast ? 'opacity-70' : ''}`}
        onClick={() => setSelectedEvent(event)}
        style={{ border: '0.5px solid var(--border)', touchAction: 'manipulation' }}
      >
        <div className="flex flex-col items-center min-w-[36px]">
          <span className="text-[11px] font-medium text-muted leading-none">{d.getMonth() + 1}월</span>
          <span
            className={`text-2xl font-black leading-tight ${isPast ? 'text-gray-400' : ''}`}
            style={isPast ? {} : { color: 'var(--purple)' }}
          >
            {d.getDate()}
          </span>
          {event.event_time && (
            <span className="text-[11px] text-muted leading-none">{formatTime(event.event_time)}</span>
          )}
        </div>
        <div className="flex-1 pt-0.5 min-w-0">
          <p className={`text-sm font-semibold ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>{event.title}</p>
          {event.place && (
            <p className="text-xs text-muted mt-0.5 truncate">📍 {event.place}</p>
          )}
          {event.notes && (
            <p className={`text-xs mt-0.5 truncate ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>{event.notes}</p>
          )}
        </div>
        <span className="text-muted text-lg shrink-0 pt-1">›</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6 flex items-center justify-between"
        style={{ background: '#A8BCCE' }}>
        <h1 className="text-xl font-black text-gray-800">일정</h1>
        {isAdmin && (
          <Link
            href="/events/new"
            className="text-sm font-semibold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
          >
            + 추가
          </Link>
        )}
      </header>

      {/* 캘린더 */}
      <div className="bg-white mx-4 mt-4 rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-1 text-muted text-lg">‹</button>
          <span className="text-sm font-bold text-gray-900">
            {year}년 {month + 1}월
          </span>
          <button onClick={next} className="p-1 text-muted text-lg">›</button>
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-muted py-1">{d}</div>
          ))}
          {cells.map((day, i) => {
            const isToday = day === today.getDate() && year === today.getFullYear() && month === today.getMonth()
            const hasEvent = day !== null && eventDays.has(day)
            const hasVote = day !== null && voteDays.has(day)
            const isSelected = day !== null && selectedDay === day
            return (
              <div
                key={i}
                className="flex flex-col items-center"
                onClick={() => day !== null && toggleDay(day)}
                style={{ cursor: day !== null ? 'pointer' : 'default', touchAction: 'manipulation', minHeight: 40 }}
              >
                {day !== null ? (
                  <>
                    <span
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors ${
                        isToday ? 'text-white font-bold' : isSelected ? 'font-bold' : 'text-gray-800'
                      }`}
                      style={
                        isToday
                          ? { background: 'var(--purple)' }
                          : isSelected
                          ? { background: 'var(--purple-light)', color: 'var(--purple)' }
                          : {}
                      }
                    >
                      {day}
                    </span>
                    <div className="flex gap-0.5 -mt-0.5">
                      {hasEvent && (
                        <span className="w-1 h-1 rounded-full" style={{ background: 'var(--purple)' }} />
                      )}
                      {hasVote && (
                        <span className="w-1 h-1 rounded-full" style={{ background: '#F97316' }} />
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* 이번 달 일정 목록 */}
      <div className="px-4 mt-4 flex flex-col gap-2 pb-2">
        <p className="text-xs font-semibold text-muted">
          {selectedDay ? `${month + 1}월 ${selectedDay}일 일정` : `${month + 1}월 일정`}
          {selectedDay && (
            <button onClick={() => setSelectedDay(null)} className="ml-2 text-purple-400 font-normal">전체보기</button>
          )}
        </p>
        {monthVotes.map((vote) => {
          const d = new Date(vote.deadline!)
          const dday = ddayLabel(vote.deadline)
          return (
            <Link key={`vote-${vote.id}`} href="/votes">
              <div
                className="bg-white rounded-[14px] px-4 py-3 flex items-start gap-4 cursor-pointer transition-colors hover:bg-orange-50 active:bg-orange-100"
                style={{ border: '0.5px solid #FED7AA' }}
              >
                <div className="flex flex-col items-center min-w-[36px]">
                  <span className="text-[11px] font-medium text-muted leading-none">{d.getMonth() + 1}월</span>
                  <span className="text-2xl font-black leading-tight" style={{ color: '#F97316' }}>
                    {d.getDate()}
                  </span>
                  <span className="text-[9px] leading-none" style={{ color: '#F97316' }}>마감</span>
                </div>
                <div className="flex-1 pt-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🗳️</span>
                    <p className="text-sm font-semibold text-gray-900 truncate">{vote.title}</p>
                  </div>
                  <p className="text-xs text-muted mt-0.5">투표 마감일</p>
                </div>
                {dday && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-1"
                    style={{ background: '#FFF7ED', color: '#F97316' }}>
                    {dday}
                  </span>
                )}
                <span className="text-muted text-lg shrink-0 pt-1">›</span>
              </div>
            </Link>
          )
        })}
        {monthEvents.length === 0 && monthVotes.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">이번 달 일정이 없습니다.</p>
        ) : (
          monthEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </div>

      {/* 지난 일정 */}
      <div className="px-4 mt-2 pb-8">
        <button
          onClick={() => setShowPast(v => !v)}
          className="w-full flex items-center justify-between py-3 text-xs font-semibold text-muted"
        >
          <span>📂 지난 일정 ({pastEvents.length}개)</span>
          <span>{showPast ? '∧ 접기' : '∨ 펼치기'}</span>
        </button>

        {showPast && (
          <div className="flex flex-col gap-2 mt-1">
            {pastEvents.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">지난 일정이 없습니다.</p>
            ) : (
              pastEvents.map((event) => (
                <EventCard key={event.id} event={event} isPast />
              ))
            )}
          </div>
        )}
      </div>

      {/* 이벤트 상세 모달 */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          members={members}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
        />
      )}
    </div>
  )
}
