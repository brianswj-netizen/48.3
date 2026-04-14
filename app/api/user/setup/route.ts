import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await req.json()
  const name: string = (body.name ?? '').trim()

  if (!name || name.length < 2 || name.length > 10) {
    return NextResponse.json({ error: '이름은 2~10자로 입력해주세요.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const kakaoId = session.user.kakaoId

  // 1. 현재 유저 name 업데이트
  const { error } = await supabase
    .from('users')
    .update({ name })
    .eq('kakao_id', kakaoId)

  if (error) {
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 })
  }

  // 2. pre_ 레코드 자동 매칭: 같은 이름의 pre_ 유저가 있으면 프로필 데이터 가져오기
  const preKey = `pre_${name}`
  const { data: preUser } = await supabase
    .from('users')
    .select('major, generation, birth_year, phone, company, position, bio')
    .eq('kakao_id', preKey)
    .single()

  if (preUser) {
    // pre_ 레코드의 프로필 데이터를 실제 유저에게 복사
    const profileData: Record<string, unknown> = {}
    if (preUser.major) profileData.major = preUser.major
    if (preUser.generation) profileData.generation = preUser.generation
    if (preUser.birth_year) profileData.birth_year = preUser.birth_year
    if (preUser.phone) profileData.phone = preUser.phone
    if (preUser.company) profileData.company = preUser.company
    if (preUser.position) profileData.position = preUser.position
    if (preUser.bio) profileData.bio = preUser.bio

    if (Object.keys(profileData).length > 0) {
      await supabase
        .from('users')
        .update(profileData)
        .eq('kakao_id', kakaoId)
    }

    // pre_ 레코드 삭제 (더 이상 필요 없음)
    await supabase
      .from('users')
      .delete()
      .eq('kakao_id', preKey)
  }

  return NextResponse.json({ ok: true })
}
