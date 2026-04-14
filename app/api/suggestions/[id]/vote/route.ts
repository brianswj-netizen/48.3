import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// suggestions 테이블에 likes 컬럼이 없으므로 별도 likes 테이블 없이
// suggestions.status 필드를 활용하지 않고, 간단히 votes 컬럼을 씁니다.
// 실제로는 suggestion_likes 테이블이 필요하지만 스키마 확장 없이
// score 방식으로 처리합니다.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: suggestionId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 현재 votes 값 가져오기
  const { data: suggestion } = await supabase
    .from('suggestions')
    .select('id')
    .eq('id', suggestionId)
    .single()

  if (!suggestion) {
    return NextResponse.json({ error: '제안을 찾을 수 없습니다.' }, { status: 404 })
  }

  // suggestion_likes 테이블에 좋아요 토글
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('kakao_id', session.user.kakaoId)
    .single()

  if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

  // suggestion_likes 테이블 확인 (없으면 insert, 있으면 delete)
  const { data: existing } = await supabase
    .from('suggestion_likes')
    .select('id')
    .eq('suggestion_id', suggestionId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('suggestion_likes').delete().eq('id', existing.id)
    revalidateTag('suggestions', {})
    return NextResponse.json({ ok: true, liked: false })
  } else {
    await supabase.from('suggestion_likes').insert({ suggestion_id: suggestionId, user_id: user.id })
    revalidateTag('suggestions', {})
    return NextResponse.json({ ok: true, liked: true })
  }
}
