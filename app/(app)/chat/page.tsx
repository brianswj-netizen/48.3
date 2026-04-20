import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/user'
import type { ChatRoom } from '@/lib/types'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// ─── 방별 마지막 메시지 2개 ───
async function getLastMessages(roomId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('chat_messages')
    .select('id, text, created_at, sender:users!sender_id(name, nickname)')
    .eq('room_id', roomId)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(2)
  return (data ?? []).reverse()
}

// ─── 방 목록 ───
async function getRooms(role: string, subgroup: string | null) {
  const supabase = createAdminClient()
  const { data: rooms } = await supabase.from('chat_rooms').select('*')
  if (!rooms) return []
  return rooms.filter((room: ChatRoom) => {
    if (role === 'admin') return true
    if (room.type === 'main') return true
    if (room.type === 'subgroup' && room.subgroup_id === subgroup) return true
    return false
  })
}

async function getDailyPickCards(categories: string[]) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('daily_cards')
    .select('id, category, title, card_date')
    .in('category', categories)
    .order('card_date', { ascending: false })
    .limit(3)
  return data ?? []
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return '방금'
  if (diff < 3_600_000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86_400_000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const ROOM_EMOJI: Record<string, string> = {
  '전체방': '💬', '입문반': '🌱', '실전반': '⚡', '꿀팁과 정보': '✨',
}

// ─── 메인 ───
export default async function LoungePage() {
  const user = await getCurrentUser()
  if (!user) return null

  if (user.role !== 'admin' && !user.subgroup) {
    redirect('/settings?require_subgroup=1')
  }

  const rooms = await getRooms(user.role, user.subgroup)
  const chatRooms = rooms.filter((r: ChatRoom) => r.name !== '꿀팁과 정보')

  const [chatWithPreview, newsItems, tipItems] = await Promise.all([
    Promise.all(chatRooms.map(async (r: ChatRoom) => ({ ...r, messages: await getLastMessages(r.id) }))),
    getDailyPickCards(['ai_news', 'deep_article', 'kr_news']),
    getDailyPickCards(['tips']),
  ])

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-4 md:pt-6" style={{ background: '#E4C0B0' }}>
        <h1 className="text-xl font-black text-gray-800">라운지</h1>
      </header>

      <div className="flex flex-col pb-8">

        {/* ─── Chat ─── */}
        <SectionHeader emoji="💬" title="Chat" />
        {chatWithPreview.length === 0 ? (
          <div className="mx-4 mb-3 p-3 rounded-2xl bg-gray-50 border border-border text-center">
            <p className="text-xs text-muted">아직 채팅방이 없습니다</p>
          </div>
        ) : (
          chatWithPreview.map(room => <RoomItem key={room.id} room={room} formatTime={formatTime} />)
        )}

        {/* ─── Daily Pick ─── */}
        <SectionHeader emoji="✨" title="Daily Pick" href="/saved-articles" />
        <div className="mx-4 mb-3 rounded-[14px] px-3 py-2.5 text-xs text-muted"
          style={{ background: '#F8F9FA', border: '0.5px solid var(--border)' }}>
          <span className="font-semibold text-gray-600">📅 요일별 콘텐츠: </span>
          월·수 AI뉴스 🤖 &nbsp;·&nbsp; 화·목 꿀팁 💡 &nbsp;·&nbsp; 금 심층기사 📖 &nbsp;·&nbsp; 토·일 국내뉴스 📰
        </div>
        <div className="mx-4 flex flex-col gap-1.5 mb-3">

          {/* Newsletter */}
          <div className="p-3 rounded-[14px]"
            style={{ background: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)', border: '0.5px solid #BAE6FD' }}>
            <a href="/saved-articles" className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: '#0EA5E9' }}>
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Newsletter</span>
            </a>
            {newsItems.length === 0 ? (
              <p className="text-xs text-muted">아직 발행된 뉴스레터가 없습니다</p>
            ) : (
              <div className="flex flex-col gap-1">
                {newsItems.map((item: any) => (
                  <a key={item.id} href={`/saved-articles?open=${item.id}`}
                    className="text-xs text-gray-700 truncate hover:text-blue-600 active:text-blue-700 block py-0.5">
                    <span className="text-muted mr-1">{item.card_date}</span>
                    {item.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* 오늘의 꿀팁 */}
          <div className="p-3 rounded-[14px]"
            style={{ background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '0.5px solid #FDE68A' }}>
            <a href="/saved-articles" className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: '#F59E0B' }}>
                <span className="text-white text-sm">💡</span>
              </div>
              <span className="text-sm font-bold text-gray-900">오늘의 꿀팁</span>
            </a>
            {tipItems.length === 0 ? (
              <p className="text-xs text-muted">아직 꿀팁이 없습니다</p>
            ) : (
              <div className="flex flex-col gap-1">
                {tipItems.map((item: any) => (
                  <a key={item.id} href={`/saved-articles?open=${item.id}`}
                    className="text-xs text-gray-700 truncate hover:text-amber-600 active:text-amber-700 block py-0.5">
                    <span className="text-muted mr-1">{item.card_date}</span>
                    {item.title}
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

// ─── 섹션 헤더 ───
function SectionHeader({ emoji, title, href }: { emoji: string; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-2">
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{title}</span>
      </div>
      {href && (
        <Link href={href} className="text-[11px] font-medium" style={{ color: 'var(--purple)' }}>
          전체보기
        </Link>
      )}
    </div>
  )
}

// ─── 방 아이템 ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RoomItem({ room, formatTime }: { room: any; formatTime: (s: string) => string }) {
  const emoji = ROOM_EMOJI[room.name] ?? '💬'
  const messages: any[] = room.messages ?? []
  const lastMsg = messages[messages.length - 1]
  const time = lastMsg ? formatTime(lastMsg.created_at) : ''

  return (
    <Link href={`/chat/${room.id}`}>
      <div className="mx-4 mb-1.5 rounded-[14px] px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        style={{ background: 'white', border: '0.5px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
            style={{ background: 'var(--purple-light)' }}>
            {emoji}
          </div>
          <div className="flex-1 flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-gray-900">{room.name}</span>
            {time && <span className="text-[11px] text-muted shrink-0">{time}</span>}
          </div>
        </div>
        {messages.length === 0 ? (
          <p className="text-xs text-muted ml-[42px]">아직 메시지가 없습니다</p>
        ) : (
          <div className="ml-[42px] flex flex-col gap-0.5">
            {messages.map((msg: any, i: number) => {
              const senderRaw = msg.sender
              const sender = Array.isArray(senderRaw) ? senderRaw[0] : senderRaw
              const senderName = sender?.name ?? sender?.nickname ?? ''
              const rawText = msg.text ?? ''
              const previewText = rawText.startsWith('__DAILY_CARD__:') ? '📰 오늘의 카드' : rawText
              const isLast = i === messages.length - 1
              return (
                <p key={msg.id} className={`text-xs truncate leading-relaxed ${isLast ? 'text-gray-700 font-medium' : 'text-muted'}`}>
                  {senderName && <span className="font-semibold">{senderName}: </span>}
                  {previewText}
                </p>
              )
            })}
          </div>
        )}
      </div>
    </Link>
  )
}
