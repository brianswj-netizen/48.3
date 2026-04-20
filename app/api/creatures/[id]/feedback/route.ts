import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

const CLAUDE_FEEDBACK_PROMPT = `당신은 AI Survival Crew의 제품 피드백 전문가입니다.
크루 멤버가 만든 앱·서비스·도구에 대해 솔직하고 건설적인 피드백을 제공합니다.
한국어로 답변하며, 격려하되 구체적으로 작성하세요.

반드시 아래 형식을 정확히 지켜서 답변하세요:

1. 훌륭한 점
i)
ii)
iii)
iv)
v)

2. 개선할 점
i)
ii)
iii)

3. Next Step
i)
ii)
iii)`

// GET: 피드백 목록 조회
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('creature_feedbacks')
    .select('id, feedback_type, content, created_at, author:users!author_id(id, name, nickname)')
    .eq('creature_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

// POST: Claude 피드백 생성 or 멤버 피드백 저장
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users').select('id, name, nickname').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: creature } = await supabase
    .from('creatures')
    .select('id, title, description, content, url, status, version')
    .eq('id', id).single()
  if (!creature) return NextResponse.json({ error: '피조물 없음' }, { status: 404 })

  const body = await req.json()
  const { type, content: userContent } = body

  // ── 멤버 피드백 저장 ──
  if (type === 'peer') {
    if (!userContent?.trim()) return NextResponse.json({ error: '내용을 입력하세요' }, { status: 400 })
    const { data, error } = await supabase.from('creature_feedbacks').insert({
      creature_id: id,
      feedback_type: 'peer',
      content: userContent.trim(),
      author_id: user.id,
    }).select('id, feedback_type, content, created_at, author:users!author_id(id, name, nickname)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // ── Claude 피드백 생성 ──
  if (type === 'claude') {
    const creatureInfo = [
      `앱/서비스 이름: ${creature.title}`,
      creature.description ? `한 줄 소개: ${creature.description}` : '',
      creature.content ? `상세 설명: ${creature.content}` : '',
      creature.url ? `URL: ${creature.url}` : '',
      `진행 단계: ${creature.status ?? '기획안'}${creature.version ? ` (${creature.version})` : ''}`,
    ].filter(Boolean).join('\n')

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: CLAUDE_FEEDBACK_PROMPT,
        messages: [{ role: 'user', content: creatureInfo }],
      }),
    })

    const aiData = await res.json()
    const generatedText = aiData.content?.[0]?.text ?? '피드백 생성에 실패했습니다.'

    // DB에 저장 (author_id null = Claude)
    const { data, error } = await supabase.from('creature_feedbacks').insert({
      creature_id: id,
      feedback_type: 'claude',
      content: generatedText,
      author_id: null,
    }).select('id, feedback_type, content, created_at').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // ── 댓글 저장 ──
  if (type === 'comment') {
    const { parentFeedbackId, content: commentContent } = body
    if (!commentContent?.trim() || !parentFeedbackId) {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
    }
    const storedContent = `__REPLY_TO:${parentFeedbackId}__\n${commentContent.trim()}`
    const { data, error } = await supabase.from('creature_feedbacks').insert({
      creature_id: id,
      feedback_type: 'peer',
      content: storedContent,
      author_id: user.id,
    }).select('id, feedback_type, content, created_at, author:users!author_id(id, name, nickname)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
}

// PATCH: 피드백 내용 수정 (Claude 피드백 편집 등)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const { feedbackId, content } = await req.json()
  if (!feedbackId || !content?.trim()) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  // 피조물 작성자 또는 어드민만 수정 가능
  const { data: creature } = await supabase
    .from('creatures').select('author_id').eq('id', id).single()
  if (!creature) return NextResponse.json({ error: '없음' }, { status: 404 })
  if (creature.author_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { error } = await supabase
    .from('creature_feedbacks')
    .update({ content: content.trim() })
    .eq('id', feedbackId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE: 피드백 삭제
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.kakaoId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id } = await params
  const url = new URL(req.url)
  const feedbackId = url.searchParams.get('feedbackId')
  if (!feedbackId) return NextResponse.json({ error: '피드백 ID 필요' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('kakao_id', session.user.kakaoId).single()
  if (!user) return NextResponse.json({ error: '유저 없음' }, { status: 404 })

  const { data: creature } = await supabase
    .from('creatures').select('author_id').eq('id', id).single()
  if (!creature) return NextResponse.json({ error: '없음' }, { status: 404 })
  if (creature.author_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  await supabase.from('creature_feedbacks').delete().eq('id', feedbackId)
  return NextResponse.json({ ok: true })
}
