import { getCurrentUser } from '@/lib/user'
import { redirect } from 'next/navigation'
import AnnouncementNewClient from '@/components/AnnouncementNewClient'

export default async function AnnouncementNewPage() {
  const user = await getCurrentUser()
  if (!user) return null

  // 어드민만 접근 가능
  if (user.role !== 'admin') {
    redirect('/announcements')
  }

  return <AnnouncementNewClient />
}
