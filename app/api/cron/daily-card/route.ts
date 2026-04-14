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

// ================================================================
// Claude 프롬프트
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
  "body": "자세히 읽기 본문 (tips 카테고리 제외, 400~600자, 문단은 \\n으로 구분. **굵게** ==하이라이트== 사용 가능)",
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
- 부동산 업무·실생활 AI 활용 관점 포함
- 친근하고 이해하기 쉬운 한국어
- 멤버들의 레벨 다양성 고려 (beginner~advanced 적절히 판단)
- 오늘 날짜 기준 최신 정보 우선`

// ================================================================
// Claude API 호출
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

const TOPIC_GUIDE: Record<CategoryKey, string> = {
  ai_news:      '오늘 가장 주목할 만한 글로벌 AI 뉴스 또는 새로운 AI 모델/서비스 출시 소식',
  tips:         '부동산 업무나 문서 작업에 바로 활용할 수 있는 AI 프롬프트 팁 3가지',
  deep_article: '최근 발표된 AI 관련 심층 보고서, 연구 결과, 또는 트렌드 분석',
  kr_news:      '국내 AI 정책, 기업 동향, 또는 부동산×AI 관련 뉴스',
}

async function generateCard(category: CategoryKey, dateStr: string): Promise<CardPayload> {
  const userMessage = `오늘 날짜: ${dateStr} (KST)\n카테고리: ${CATEGORIES[category].label}\n\n${TOPIC_GUIDE[category]}를 웹 검색으로 찾아 카드를 작성해주세요.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':        process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-beta':   'web-search-2025-03-05',
      'content-type':     'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const textBlock = data.content?.findLast((b: { type: string }) => b.type === 'text') as
    | { type: 'text'; text: string }
    | undefined

  if (!textBlock) throw new Error('Claude 응답에 text 블록 없음')

  // JSON 객체 추출 (앞뒤 설명 텍스트 제거)
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`JSON 블록 없음. 응답: ${textBlock.text.slice(0, 200)}`)
  return JSON.parse(jsonMatch[0]) as CardPayload
}

// ================================================================
// 메인 핸들러
// ================================================================
export async function GET(req: NextRequest) {
  // 인증
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const force = req.nextUrl.searchParams.get('force') === 'true'
  const supabase = createAdminClient()

  // KST 기준 날짜/요일
  const nowKst  = new Date(Date.now() + 9 * 3600_000)
  const kstDay  = nowKst.getUTCDay()
  const dateStr = nowKst.toISOString().slice(0, 10)

  // 중복 확인
  const { data: existing } = await supabase
    .from('daily_cards')
    .select('id, message_id')
    .eq('card_date', dateStr)
    .maybeSingle()

  if (existing && !force) {
    return NextResponse.json({ skipped: true, reason: '오늘 카드가 이미 존재합니다.', date: dateStr })
  }

  // force=true면 기존 레코드 삭제 (메시지는 그대로 둠)
  if (existing && force) {
    await supabase.from('daily_cards').delete().eq('id', existing.id)
  }

  const category = getCategoryByKstDay(kstDay)
  const cat      = CATEGORIES[category]

  // 봇 유저 / 전체방 조회
  const [{ data: botUser }, { data: mainRoom }] = await Promise.all([
    supabase.from('users').select('id').eq('kakao_id', 'system_bot').single(),
    supabase.from('chat_rooms').select('id').eq('type', 'main').single(),
  ])

  if (!botUser) return NextResponse.json({ error: 'system_bot 유저 없음' }, { status: 500 })
  if (!mainRoom) return NextResponse.json({ error: '전체방 없음' }, { status: 500 })

  // Claude 호출 (최대 3회 재시도)
  let card: CardPayload | null = null
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      card = await generateCard(category, dateStr)
      break
    } catch (err) {
      lastError = err as Error
      console.error(`[daily-card] Claude 실패 (${attempt}/3):`, err)
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt))
    }
  }
  if (!card) return NextResponse.json({ error: 'Claude API 실패', detail: lastError?.message }, { status: 500 })

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

  // 채팅 메시지 — __DAILY_CARD__:{json} 형식으로 저장 (프론트에서 카드 렌더링)
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

  const { data: message, error: msgErr } = await supabase
    .from('chat_messages')
    .insert({
      room_id:   mainRoom.id,
      sender_id: botUser.id,
      text:      `__DAILY_CARD__:${cardJson}`,
    })
    .select('id')
    .single()

  if (msgErr) {
    return NextResponse.json({
      success: false,
      warning: '카드 저장됨, 채팅 발송 실패',
      card_id: savedCard.id,
      error:   msgErr.message,
    }, { status: 207 })
  }

  // message_id 업데이트
  await supabase.from('daily_cards').update({ message_id: message.id }).eq('id', savedCard.id)

  console.log(`[daily-card] ✅ ${dateStr} ${cat.label} 카드 발행 완료`)

  return NextResponse.json({
    success:  true,
    date:     dateStr,
    category,
    title:    card.title,
    card_id:  savedCard.id,
    msg_id:   message.id,
  })
}
