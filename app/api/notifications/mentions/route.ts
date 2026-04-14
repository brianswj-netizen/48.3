import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json([], { status: 200 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json([], { status: 200 })

  const { data } = await supabase
    .from('mention_notifications')
    .select('id, message_text, room_name, room_id, sender_id, created_at, is_read, sender:users!sender_id(name, nickname)')
    .eq('mentioned_user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { ids } = await req.json()
  if (!ids?.length) return NextResponse.json({ ok: true })

  const supabase = createAdminClient()
  await supabase
    .from('mention_notifications')
    .update({ is_read: true })
    .in('id', ids)

  return NextResponse.json({ ok: true })
}
