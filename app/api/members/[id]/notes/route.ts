import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/members/[id]/notes — 내가 이 멤버에게 작성한 메모 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: me } = await supabase
    .from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!me?.id) return NextResponse.json({ error: '사용자 없음' }, { status: 404 })

  const { id: targetId } = await params
  const { data } = await supabase
    .from('member_notes')
    .select('content, updated_at')
    .eq('author_id', me.id)
    .eq('target_member_id', targetId)
    .single()

  return NextResponse.json({ content: data?.content ?? '', updated_at: data?.updated_at ?? null })
}

// PUT /api/members/[id]/notes — 메모 저장 (upsert)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: me } = await supabase
    .from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!me?.id) return NextResponse.json({ error: '사용자 없음' }, { status: 404 })

  const { id: targetId } = await params
  const { content } = await req.json()

  const { data, error } = await supabase
    .from('member_notes')
    .upsert(
      {
        author_id: me.id,
        target_member_id: targetId,
        content: content ?? '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'author_id,target_member_id' }
    )
    .select('content, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
