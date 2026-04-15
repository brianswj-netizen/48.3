import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return null
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('kakao_id', session.user.kakaoId)
    .single()
  return data?.role === 'admin' ? supabase : null
}

// GET: pre_등록된 멤버 목록
export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { data, error } = await supabase
    .from('users')
    .select('id, kakao_id, name, major, generation, birth_year, phone, company, position, bio, created_at')
    .like('kakao_id', 'pre_%')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST: pre_ 멤버 등록
export async function POST(req: NextRequest) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const body = await req.json()
  const { name, major, generation, birth_year, phone, company, position, bio } = body

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }

  const trimmedName = name.trim()
  const preKey = `pre_${trimmedName}`

  // 중복 확인
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('kakao_id', preKey)
    .single()

  if (existing) {
    return NextResponse.json({ error: `${trimmedName} 님의 사전 프로필이 이미 등록되어 있습니다.` }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      kakao_id: preKey,
      name: trimmedName,
      role: 'member',
      status: 'approved',
      major: major || null,
      generation: generation ? Number(generation) : null,
      birth_year: birth_year ? Number(birth_year) : null,
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      position: position?.trim() || null,
      bio: bio?.trim() || null,
    })
    .select('id, kakao_id, name, major, generation, birth_year, phone, company, position, bio, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: pre_ 멤버 삭제
export async function DELETE(req: NextRequest) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
    .like('kakao_id', 'pre_%') // 안전장치: pre_ 레코드만 삭제

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
