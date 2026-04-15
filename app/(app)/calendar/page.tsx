import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import { getMentionMembers } from '@/lib/members'
import CalendarClient from '@/components/CalendarClient'

const getEvents = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('events')
      .select('id, title, place, notes, event_date, event_time, created_by, image_url')
      .order('event_date', { ascending: true })
      .limit(100)
    return data ?? []
  },
  ['calendar-events'],
  { revalidate: 30, tags: ['events'] }
)

const getVoteDeadlines = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('votes')
      .select('id, title, deadline')
      .not('deadline', 'is', null)
      .order('deadline', { ascending: true })
      .limit(50)
    return data ?? []
  },
  ['calendar-votes'],
  { revalidate: 60, tags: ['votes'] }
)

export default async function CalendarPage() {
  const [user, events, members, votes] = await Promise.all([
    getCurrentUser(),
    getEvents(),
    getMentionMembers(),
    getVoteDeadlines(),
  ])
  return (
    <CalendarClient
      events={events}
      votes={votes}
      isAdmin={user?.role === 'admin'}
      currentUserId={user?.id ?? null}
      currentUserName={user?.name ?? user?.nickname ?? null}
      members={members}
    />
  )
}
