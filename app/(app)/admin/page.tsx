import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/user'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminClient from '@/components/AdminClient'

async function getPendingUsers() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('id, name, nickname, avatar_url, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  return data ?? []
}

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/')

  const pendingUsers = await getPendingUsers()

  return <AdminClient pendingUsers={pendingUsers} />
}
