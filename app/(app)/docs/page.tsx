import { createAdminClient } from '@/lib/supabase/admin'
import DocsClient from '@/components/DocsClient'

async function getDocs() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('documents')
    .select('id, title, url, tag, created_at, uploader:users!uploader_id(name, nickname)')
    .order('created_at', { ascending: false })
    .limit(50)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((d: any) => ({
    ...d,
    uploader: Array.isArray(d.uploader) ? d.uploader[0] ?? null : d.uploader,
  }))
}

async function getPhotos() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('photos')
    .select('id, url, created_at')
    .order('created_at', { ascending: false })
    .limit(60)
  return data ?? []
}

export default async function DocsPage() {
  const [docs, photos] = await Promise.all([getDocs(), getPhotos()])
  return <DocsClient docs={docs} photos={photos} />
}
