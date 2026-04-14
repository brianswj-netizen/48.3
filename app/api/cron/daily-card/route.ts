import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ================================================================
// 카테고리 설정
// ================================================================
const CATEGORIES = {
  ai_news:      { label: 'AI 뉴스 & 신규 툴', chip: '📰 AI 뉴스',  color: '#2880A0', light: '#DFF0F8' },
  tips:         { label: '실전 팁 & 프롬프트', chip: '🛠 실전 팁',  color: '#7B6FC4', light: '#EDEBFA' },
  deep_article: { label: '심층 아티클',        chip: '📚 심층 읽기', color: '#C49030', light: '#FAF0D8' },
  kr_news:      { label: '국내 AI 소식',       chip: '🇰🇷 국내 소식', color: '#D86040', light: '#FAEDE8' },
} as const

type CategoryKey = keyof typeof CATEGORIES

function getCategoryByKstDay(kstDay: number): CategoryKey {
  switch (kstDay) {
    case 1: case 3: return 'ai_news'
    case 2: case 4: return 'tips'
    case 5:         return 'deep_article'
    default:        return 'kr_news'
  }
}

function stripCiteTags(text: string | null): string | null {
  if (!text) return null
  return text.replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, '$1').trim()
}

// ================================================================
// Claude 프롬프트 — 뉴스레터 카드
// ================================================================
const SYSTEM_PROMPT = `당신은 AI Survival Crew(건국대 부동산대학원 AI 스터디)의 일간 AI 카드 에디터입니다.
멤버들에게 매일 아침 유익한 AI 카드 하나를 작성합니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트나 마크다운 코드펜스 없이 순수 JSON만 출력하세요:

{
  "title": "제목 (30자 이내, 임팩트 있게)",
  "source_name": "출처 매체명 (예: The Verge, 조선일보 등)",
  "source_url": "출처 URL 또는 null",
  "level": "beginner | intermediate | advanced",
  "tldr": ["30초 요약 항목1", "30초 요약 항목2", "30초 요약 항목3"],
  "body": "자세히 읽기 본문 (tips 카테고리 제외, 400~600자, 문단은 \\n으로 구분. **굵게** ==하이라이트== 사용 가능. HTML 태그 절대 사용 금지)",
  "tips": null,
  "quote": "원문에서 인상적인 한 문장 인용 또는 null",
  "quote_src": "— 출처명, 날짜 형식 또는 null"
}

tips 카테고리일 때는 body를 null로 하고 tips를 아래 형식으로 작성:
"tips": [
  {"title": "팁 제목", "desc": "팁 설명 (1~3문장)"},
  {"title": "팁 제목2", "desc": "팁 설명2"},
  {"title": "팁 제목3", "desc": "팁 설명3"}
]

작성 원칙:
- HTML 태그(<cite>, <a> 등) 절대 사용 금지, 순수 텍스트와 **굵게** ==하이라이트== 만 사용
- 부동산 업무·실생활 AI 활용 관점 포함
- 친근하고 이해하기 쉬운 한국어
- 멤버들의 레벨 다양성 고려 (beginner~advanced 적절히 판단)
- 오늘 날짜 기준 최신 정보 우선`

// ================================================================
// Claude 프롬프트 — 오늘의 꿀팁 (초보자 + 숙련자)
// ================================================================
const TIPS_SYSTEM_PROMPT = `당신은 AI 실전 활용 코치입니다.
매일 아침 AI Survival Crew 멤버들을 위해 실용적인 AI 꿀팁 2개를 작성합니다.

반드시 아래 JSON 형식으로만 응답하세요. HTML 태그 절대 사용 금지:

{
  "title": "오늘의 꿀팁",
  "tips": [
    {
      "title": "🟢 초보자 팁: [한 줄 제목]",
      "desc": "초보자도 바로 따라할 수 있는 팁. ChatGPT, Claude 등 AI 도구를 처음 쓰는 사람 기준. 구체적인 예시나 프롬프트 포함. 2~4문장."
    },
    {
      "title": "🔴 숙련자 팁: [한 줄 제목]",
      "desc": "AI를 어느 정도 써본 사람을 위한 고급 활용법. API, 자동화, 프롬프트 엔지니어링, 업무 통합 등. 구체적이고 실행 가능하게. 2~4문장."
    }
  ]
}`

// ================================================================
// 인터페이스
// ================================================================
interface CardPayload {
  title: string
  source_name: string
  source_url: string | null
  level: 'beginner' | 'intermediate' | 'advanced'
  tldr: string[]
  body: string | null
  tips: { title: string; desc: string }[] | null
  quote: string | null
  quote_src: string | null
}

interface TipsPayload {
  title: string
  tips: { title: string; desc: string }[]
}

const TOPIC_GUIDE: Record<CategoryKey, string> = {
  ai_news:      '오늘 가장 주목할 만한 글로벌 AI 뉴스 또는 새로운 AI 모델/서비스 출시 소식',
  tips:         '부동산 업무나 문서 작업에 바로 활용할 수 있는 AI 프롬프트 팁 3가지',
  deep_article: '최근 발표된 AI 관련 심층 보고서, 연구 결과, 또는 트렌드 분석',
  kr_news:      '국내 AI 정책, 기업 동향, 또는 부동산×AI 관련 뉴스',
}

async function callClaude(systemPrompt: string, userMessage: string, useWebSearch = false): Promise<string> {
  const body: Record<string, unknown> = {
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system:     systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  }
  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }]
  }

  const headers: Record<string, string> = {
    'x-api-key':        process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
    'content-type':     'application/json',
  }
  if (useWebSearch) headers['anthropic-beta'] = 'web-search-2025-03-05'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const textBlock = data.content?.findLast((b: { type: string }) => b.type === 'text') as
    | { type: 'text'; text: string } | undefined
  if (!textBlock) throw new Error('Claude 응답에 text 블록 없음')
  return textBlock.text
}

async function generateCard(category: CategoryKey, dateStr: string): Promise<CardPayload> {
  const userMessage = `오늘 날짜: ${dateStr} (KST)\n카테고리: ${CATEGORIES[category].label}\n\n${TOPIC_GUIDE[category]}를 웹 검색으로 찾아 카드를 작성해주세요.`
  const text = await callClaude(SYSTEM_PROMPT, userMessage, true)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`JSON 블록 없음. 응답: ${text.slice(0, 200)}`)
  return JSON.parse(jsonMatch[0]) as CardPayload
}

async function generateTips(dateStr: string): Promise<TipsPayload> {
  const userMessage = `오늘 날짜: ${dateStr} (KST)\n\n오늘의 AI 꿀팁 2개(초보자용 1개, 숙련자용 1개)를 작성해주세요. 부동산 업무나 실생활 AI 활용 관점을 포함해 주세요.`
  const text = await callClaude(TIPS_SYSTEM_PROMPT, userMessage, false)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Tips JSON 블록 없음. 응답: ${text.slice(0, 200)}`)
  return JSON.parse(jsonMatch[0]) as TipsPayload
}

// ================================================================
// 메인 핸들러
// ================================================================
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const force = req.nextUrl.searchParams.get('force') === 'true'
  const supabase = createAdminClient()

  const nowKst  = new Date(Date.now() + 9 * 3600_000)
  const kstDay  = nowKst.getUTCDay()
  const dateStr = nowKst.toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('daily_cards')
    .select('id, message_id')
    .eq('card_date', dateStr)
    .maybeSingle()

  if (existing && !force) {
    return NextResponse.json({ skipped: true, reason: '오늘 카드가 이미 존재합니다.', date: dateStr })
  }
  if (existing && force) {
    await supabase.from('daily_cards').delete().eq('id', existing.id)
  }

  const category = getCategoryByKstDay(kstDay)
  const cat      = CATEGORIES[category]

  // 봇 유저 / '꿀팁과 정보' 방 조회 (중복 방 있어도 첫 번째 사용, 없으면 main 타입 첫 번째 방)
  const [{ data: botUser }, { data: tipsRooms }] = await Promise.all([
    supabase.from('users').select('id').eq('kakao_id', 'system_bot').single(),
    supabase.from('chat_rooms').select('id').eq('name', '꿀팁과 정보').limit(1),
  ])

  let targetRoomId = tipsRooms?.[0]?.id
  if (!targetRoomId) {
    const { data: mainRooms } = await supabase.from('chat_rooms').select('id').eq('type', 'main').limit(1)
    targetRoomId = mainRooms?.[0]?.id
  }

  if (!botUser) return NextResponse.json({ error: 'system_bot 유저 없음' }, { status: 500 })
  if (!targetRoomId) return NextResponse.json({ error: '채팅방 없음' }, { status: 500 })

  // Claude 호출 (뉴스레터 + 꿀팁 병렬) — 최대 3회 재시도
  let card: CardPayload | null = null
  let tips: TipsPayload | null = null
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const [cardResult, tipsResult] = await Promise.allSettled([
        generateCard(category, dateStr),
        generateTips(dateStr),
      ])
      if (cardResult.status === 'fulfilled') card = cardResult.value
      else throw cardResult.reason
      if (tipsResult.status === 'fulfilled') tips = tipsResult.value
      break
    } catch (err) {
      lastError = err as Error
      console.error(`[daily-card] Claude 실패 (${attempt}/3):`, err)
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt))
    }
  }
  if (!card) return NextResponse.json({ error: 'Claude API 실패', detail: lastError?.message }, { status: 500 })

  // cite 태그 제거
  card.body = stripCiteTags(card.body)

  // daily_cards 저장
  const { data: savedCard, error: cardErr } = await supabase
    .from('daily_cards')
    .insert({
      category,
      title:       card.title,
      summary:     card.tldr?.join(' / ') ?? '',
      source_url:  card.source_url,
      tags:        [],
      color:       cat.color,
      card_date:   dateStr,
      source_name: card.source_name,
      level:       card.level,
      tldr:        card.tldr,
      body:        card.body,
      tips:        card.tips,
      quote:       card.quote,
      quote_src:   card.quote_src,
    })
    .select('id')
    .single()

  if (cardErr) return NextResponse.json({ error: cardErr.message }, { status: 500 })

  // 뉴스레터 카드 채팅 메시지 전송
  const cardJson = JSON.stringify({
    category,
    title:       card.title,
    source_name: card.source_name,
    source_url:  card.source_url,
    level:       card.level,
    tldr:        card.tldr,
    body:        card.body,
    tips:        card.tips,
    quote:       card.quote,
    quote_src:   card.quote_src,
    date:        dateStr,
  })

  const { data: message } = await supabase
    .from('chat_messages')
    .insert({ room_id: targetRoomId, sender_id: botUser.id, text: `__DAILY_CARD__:${cardJson}` })
    .select('id')
    .single()

  if (message) {
    await supabase.from('daily_cards').update({ message_id: message.id }).eq('id', savedCard.id)
  }

  // 꿀팁 카드 채팅 메시지 전송 (생성 성공한 경우)
  let tipsMessageId: string | null = null
  if (tips) {
    const tipsJson = JSON.stringify({
      category: 'tips' as const,
      title:    tips.title,
      tldr:     tips.tips.map(t => t.title),
      tips:     tips.tips,
      date:     dateStr,
    })
    const { data: tipsMsg } = await supabase
      .from('chat_messages')
      .insert({ room_id: targetRoomId, sender_id: botUser.id, text: `__DAILY_CARD__:${tipsJson}` })
      .select('id')
      .single()
    tipsMessageId = tipsMsg?.id ?? null
  }

  console.log(`[daily-card] ✅ ${dateStr} ${cat.label} 카드 발행 완료 → 방: 꿀팁과 정보`)

  return NextResponse.json({
    success:       true,
    date:          dateStr,
    category,
    title:         card.title,
    card_id:       savedCard.id,
    msg_id:        message?.id,
    tips_msg_id:   tipsMessageId,
    room_id:       targetRoomId,
  })
}
