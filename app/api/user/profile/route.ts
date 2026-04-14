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
  const { major, generation, birth_year, phone, company, position, bio } = body

  const validMajors = ['글프', '건개', '경관', '금투']
  if (major && !validMajors.includes(major)) {
    return NextResponse.json({ error: '올바른 전공을 선택해주세요.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const updates: Record<string, unknown> = {}

  if (major !== undefined) updates.major = major
  if (generation !== undefined) updates.generation = generation ? Number(generation) : null
  if (birth_year !== undefined) updates.birth_year = birth_year ? Number(birth_year) : null
  if (phone !== undefined) updates.phone = phone?.trim() || null
  if (company !== undefined) updates.company = company?.trim() || null
  if (position !== undefined) updates.position = position?.trim() || null
  if (bio !== undefined) updates.bio = bio?.trim() || null

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('kakao_id', session.user.kakaoId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
