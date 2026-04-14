import { getCurrentUser } from '@/lib/user'
import SettingsClient from '@/components/SettingsClient'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  return <SettingsClient user={user} />
}
