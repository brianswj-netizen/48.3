import { createClient } from '@supabase/supabase-js'

// Service Role 키를 사용하는 서버 전용 클라이언트 (RLS 우회)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
