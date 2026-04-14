import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'

function formatTime(time: string | null) {
  if (!time) return ''
  return time.slice(0, 5)
}

const getUpcomingEvents = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('events')
      .select('id, title, place, event_date, event_time')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(2)
    return data ?? []
  },
  ['right-panel-events'],
  { revalidate: 300, tags: ['events'] }
)

const getTopMembers = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('users')
      .select('id, name, nickname, avatar_url, score, major, generation')
      .not('name', 'is', null)
      .not('kakao_id', 'like', 'pre_%')
      .order('score', { ascending: false })
      .limit(3)
    return data ?? []
  },
  ['right-panel-top-members'],
  { revalidate: 300, tags: ['members'] }
)

const AVATAR_COLORS = [
  '#534AB7', '#1D9E75', '#D85A30', '#BA7517',
  '#6366F1', '#0EA5E9', '#EC4899', '#8B5CF6',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const RANK_COLORS = ['#BA7517', '#6B7280', '#D85A30']

export default async function RightPanel() {
  const [events, topMembers] = await Promise.all([
    getUpcomingEvents(),
    getTopMembers(),
  ])

  return (
    <aside className="hidden lg:flex flex-col shrink-0 gap-4 py-6 pr-4" style={{ width: '280px' }}>

      {/* 다음 일정 */}
      <div className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">다음 일정</p>
          <Link href="/calendar" className="text-xs" style={{ color: 'var(--purple)' }}>전체보기</Link>
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-muted text-center py-3">예정된 일정이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map(event => {
              const d = new Date(event.event_date)
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center min-w-[32px]">
                    <span className="text-[10px] font-medium text-muted leading-none">{d.getMonth() + 1}월</span>
                    <span className="text-xl font-black leading-tight" style={{ color: 'var(--purple)' }}>
                      {d.getDate()}
                    </span>
                    {event.event_time && (
                      <span className="text-[10px] text-muted leading-none">{formatTime(event.event_time)}</span>
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{event.title}</p>
                    {event.place && (
                      <p className="text-[11px] text-muted mt-0.5">📍 {event.place}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 활동지수 TOP 3 */}
      <div className="bg-white rounded-[14px] p-4" style={{ border: '0.5px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">활동지수 TOP 3</p>
          <Link href="/members" className="text-xs" style={{ color: 'var(--purple)' }}>전체보기</Link>
        </div>
        {topMembers.length === 0 ? (
          <p className="text-xs text-muted text-center py-3">멤버 정보가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {topMembers.map((member, i) => {
              const displayName = member.name ?? member.nickname ?? '?'
              const sub = [member.major, member.generation ? `${member.generation}기` : null].filter(Boolean).join(' ')
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <span className="text-sm font-black w-5 text-center shrink-0" style={{ color: RANK_COLORS[i] }}>
                    {i + 1}
                  </span>
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt={displayName} width={32} height={32}
                      className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: getAvatarColor(displayName) }}
                    >
                      {displayName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                    {sub && <p className="text-[10px] text-muted truncate">{sub}</p>}
                  </div>
                  <span className="text-sm font-black shrink-0" style={{ color: 'var(--purple)' }}>
                    {member.score}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </aside>
  )
}
