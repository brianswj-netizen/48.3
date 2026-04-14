import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

function getKSTDate(date: Date) {
  // UTC+9
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await req.json()
  const { bio, subgroup } = body

  const validSubgroups = ['입문반', '실전반']
  if (subgroup && !validSubgroups.includes(subgroup)) {
    return NextResponse.json({ error: '올바른 소모임을 선택해주세요.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 소모임 변경 시 제한 확인
  if (subgroup) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('subgroup, subgroup_changed_at, role')
      .eq('kakao_id', session.user.kakaoId)
      .single()

    // 어드민은 제한 없음
    if (currentUser?.role !== 'admin') {
      const isFirstSelection = !currentUser?.subgroup

      if (!isFirstSelection) {
        // 기존 소모임이 있는 경우 → 일요일 + 7일 경과 확인
        const nowKST = getKSTDate(new Date())
        const dayOfWeek = nowKST.getDay() // 0 = 일요일

        if (dayOfWeek !== 0) {
          return NextResponse.json(
            { error: '소모임 변경은 일요일에만 가능합니다.' },
            { status: 403 }
          )
        }

        if (currentUser?.subgroup_changed_at) {
          const lastChanged = new Date(currentUser.subgroup_changed_at)
          const diffMs = new Date().getTime() - lastChanged.getTime()
          const diffDays = diffMs / (1000 * 60 * 60 * 24)

          if (diffDays < 7) {
            const nextAvailable = new Date(lastChanged.getTime() + 7 * 24 * 60 * 60 * 1000)
            const nextAvailableKST = getKSTDate(nextAvailable)
            // 다음 일요일 계산
            const daysUntilSunday = (7 - nextAvailableKST.getDay()) % 7
            const nextSunday = new Date(nextAvailableKST)
            nextSunday.setDate(nextAvailableKST.getDate() + daysUntilSunday)
            const dateStr = `${nextSunday.getMonth() + 1}월 ${nextSunday.getDate()}일`
            return NextResponse.json(
              { error: `소모임은 1주일에 1번만 변경할 수 있습니다. 다음 변경 가능일: ${dateStr} (일요일)` },
              { status: 403 }
            )
          }
        }
      }
    }
  }

  const updates: Record<string, string> = {}
  if (typeof bio === 'string') updates.bio = bio.trim()
  if (subgroup) {
    updates.subgroup = subgroup
    updates.subgroup_changed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('kakao_id', session.user.kakaoId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 유저 프로필 캐시 즉시 무효화 (소모임, 바이오 변경 반영)
  revalidateTag(`user-${session.user.kakaoId}`, {})
  revalidateTag('members', {})

  return NextResponse.json({ ok: true })
}
