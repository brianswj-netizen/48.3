import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 점수 갱신 크론 엔드포인트
// Vercel Cron 또는 외부 스케줄러에서 매일 자정 호출
// 헤더: Authorization: Bearer {CRON_SECRET}

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.rpc('recalculate_all_crew_scores')

  if (error) {
    console.error('[refresh-scores] RPC error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated_at: new Date().toISOString() })
}

// 어드민 수동 실행용 GET (개발 환경 또는 어드민 호출)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.rpc('recalculate_all_crew_scores')

  if (error) {
    console.error('[refresh-scores] RPC error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated_at: new Date().toISOString() })
}
