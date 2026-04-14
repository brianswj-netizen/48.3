import { getCurrentUser } from '@/lib/user'
import EventNewClient from '@/components/EventNewClient'

export default async function EventNewPage() {
  const user = await getCurrentUser()
  if (!user) return null

  return <EventNewClient />
}
