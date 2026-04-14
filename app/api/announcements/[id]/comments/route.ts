import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveMentionNotifications } from '@/lib/mention'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('announcement_comments')
    .select('id, text, created_at, author_id, author:users!author_id(name, nickname)')
    .eq('announcement_id', id)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: '내용 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('id, name, nickname').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data, error } = await supabase
    .from('announcement_comments')
    .insert({ announcement_id: id, author_id: user.id, text: text.trim() })
    .select('id, text, created_at, author_id, author:users!author_id(name, nickname)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await saveMentionNotifications({
    text: text.trim(),
    senderId: user.id,
    sourceType: 'announcement_comment',
    sourceId: id,
  })

  return NextResponse.json(data)
}
