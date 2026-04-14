import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `당신은 건국대 부동산대학원 AI 스터디 크루(AI Survival Crew)의 AI 평가관입니다.
원우들이 공유한 AI 활용 결과물을 평가해주세요.

평가 시 다음 순서로, 친근하고 격려하는 톤으로 150자 내외로 답해주세요:
1. 잘한 점
2. 개선 아이디어
3. 레벨 판정 (1~6단계 중)
4. 다음 액션 제안

AI 레벨 기준:
- 레벨 1 🌊 AI 입문자: AI 툴 사용 경험 거의 없음
- 레벨 2 🚢 AI 갑판원: ChatGPT 등 AI 툴 사용 경험 있음
- 레벨 3 ⚓ AI 갑판장: AI 툴로 결과물 직접 제작
- 레벨 4 🧭 AI 조타수: 업무에 AI 실제 적용
- 레벨 5 ⚙️ AI 기관사: 타인이 쓸 수 있는 수준으로 배포
- 레벨 6 🚀 AI 선장: 팀/조직을 AI로 이끄는 단계`

export async function POST(req: NextRequest) {
  try {
    const { message, level } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { reply: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.' },
        { status: 200 }
      )
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `현재 레벨: ${level}단계\n\n${message}`,
          },
        ],
      }),
    })

    const data = await res.json()
    const reply = data.content?.[0]?.text ?? '응답을 받지 못했습니다.'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('evaluate error:', err)
    return NextResponse.json({ reply: '오류가 발생했습니다.' }, { status: 500 })
  }
}
