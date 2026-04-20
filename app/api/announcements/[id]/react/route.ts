import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

// GET: 이모지별 반응한 사람 목록
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('announcement_reactions')
    .select('emoji, user:users!user_id(name, nickname)')
    .eq('announcement_id', id)

  if (!data) return NextResponse.json({})

  const result: Record<string, string[]> = {}
  for (const r of data) {
    const u = Array.isArray(r.user) ? r.user[0] : r.user
    const name = (u as any)?.name ?? (u as any)?.nickname ?? '?'
    if (!result[r.emoji]) result[r.emoji] = []
    result[r.emoji].push(name)
  }
  return NextResponse.json(result)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const { emoji } = await req.json()
  if (!emoji) return NextResponse.json({ error: '이모지 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase.from('users').select('id').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  // 본인 글에는 리액션 불가
  const { data: ann } = await supabase.from('announcements').select('created_by').eq('id', id).single()
  if (ann?.created_by === user.id) {
    return NextResponse.json({ error: '본인 글에는 리액션할 수 없습니다' }, { status: 403 })
  }

  // 이 유저의 기존 리액션 조회 (이모지 종류 무관 — 하나만 허용)
  const { data: existing } = await supabase
    .from('announcement_reactions')
    .select('id, emoji')
    .eq('announcement_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.emoji === emoji) {
    // 같은 이모지 클릭 → 토글 off
    await supabase.from('announcement_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ reacted: false, emoji, previousEmoji: null })
  }

  // 다른 이모지 → 기존 삭제 후 새로 추가
  if (existing) {
    await supabase.from('announcement_reactions').delete().eq('id', existing.id)
  }
  await supabase.from('announcement_reactions').insert({ announcement_id: id, user_id: user.id, emoji })
  return NextResponse.json({ reacted: true, emoji, previousEmoji: existing?.emoji ?? null })
}
