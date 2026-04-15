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
      .select('id, title, place, notes, event_date, event_time, created_by')
      .order('event_date', { ascending: true })
      .limit(100)
    return data ?? []
  },
  ['calendar-events'],
  { revalidate: 300, tags: ['events'] }
)

export default async function CalendarPage() {
  const [user, events, members] = await Promise.all([getCurrentUser(), getEvents(), getMentionMembers()])
  return <CalendarClient events={events} isAdmin={user?.role === 'admin'} currentUserId={user?.id ?? null} currentUserName={user?.name ?? user?.nickname ?? null} members={members} />
}
