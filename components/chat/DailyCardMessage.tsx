'use client'

import React from 'react'

export interface DailyCardData {
  category: 'ai_news' | 'tips' | 'deep_article' | 'kr_news'
  title: string
  source_name?: string
  source_url?: string | null
  level?: 'beginner' | 'intermediate' | 'advanced'
  tldr: string[]
  body?: string | null
  tips?: { title: string; desc: string }[] | null
  quote?: string | null
  quote_src?: string | null
  date: string
}

const CAT = {
  ai_news:      { color: '#2880A0', light: '#DFF0F8', chip: '📰 AI 뉴스',  label: '오늘의 AI 뉴스' },
  tips:         { color: '#7B6FC4', light: '#EDEBFA', chip: '🛠 실전 팁',   label: '오늘의 실전 팁' },
  deep_article: { color: '#C49030', light: '#FAF0D8', chip: '📚 심층 읽기', label: '오늘의 심층 아티클' },
  kr_news:      { color: '#D86040', light: '#FAEDE8', chip: '🇰🇷 국내 소식', label: '오늘의 국내 AI 소식' },
}

const LEVEL = {
  beginner:     { emoji: '🟢', label: '입문', bg: '#16a34a20', border: '#16a34a40', color: '#4ade80' },
  intermediate: { emoji: '🟡', label: '중급', bg: '#d9770620', border: '#d9770640', color: '#fbbf24' },
  advanced:     { emoji: '🔴', label: '심화', bg: '#dc262620', border: '#dc262640', color: '#f87171' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mm}.${dd} · ${days[d.getDay()]}`
}

// 간단한 마크다운 인라인 파서: **bold**, ==highlight==
function renderInline(text: string, catColor: string, catLight: string) {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|==(.+?)==/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[1]) {
      parts.push(<strong key={key++} style={{ color: '#1F2937', fontWeight: 700 }}>{match[1]}</strong>)
    } else if (match[2]) {
      parts.push(
        <mark key={key++} style={{ background: catLight, color: catColor, borderRadius: 3, padding: '1px 3px', fontWeight: 600 }}>
          {match[2]}
        </mark>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

interface DailyCardProps {
  data: DailyCardData
  messageId?: string
  roomId?: string
  likeCount?: number
  likedByMe?: boolean
  onLike?: () => void
}

export default function DailyCardMessage({ data, likeCount = 0, likedByMe = false, onLike }: DailyCardProps) {
  const cat   = CAT[data.category]   ?? CAT.ai_news
  const level = LEVEL[data.level ?? 'beginner']

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '1px solid #E8DDD0',
      overflow: 'hidden',
      width: '100%',
      maxWidth: 460,
      fontFamily: "'Noto Sans KR', sans-serif",
      fontSize: 14,
    }}>

      {/* ── TOP BAR ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #E8DDD0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:cat.color, flexShrink:0 }} />
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.6px', color:'#374151' }}>AI SURVIVAL CREW</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:cat.light, color:cat.color }}>
            {cat.chip}
          </span>
          <span style={{ fontSize:11, color:'#8B7B6B' }}>{formatDate(data.date)}</span>
        </div>
      </div>

      {/* ── CARD HEAD ── */}
      <div style={{ padding:'16px 16px 12px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.5px', color:cat.color, marginBottom:6 }}>
            {cat.label}
          </div>
          <h2 style={{ fontSize:17, fontWeight:900, color:'#111827', lineHeight:1.45, marginBottom:6, margin:'0 0 6px' }}>
            {data.title}
          </h2>
          {(data.source_name || data.source_url) && (
            <p style={{ fontSize:12, color:'#8B7B6B', margin:0 }}>
              출처:{' '}
              {data.source_url ? (
                <a href={data.source_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontWeight:600, color:cat.color, textDecoration:'none' }}>
                  {data.source_name ?? data.source_url}
                </a>
              ) : (
                <span style={{ fontWeight:600 }}>{data.source_name}</span>
              )}
              {data.source_url && (
                <> · <a href={data.source_url} target="_blank" rel="noopener noreferrer"
                  style={{ color:cat.color, textDecoration:'none' }}>🔗 원문 바로가기 ↗</a></>
              )}
            </p>
          )}
        </div>
        <span style={{
          fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0,
          background:level.bg, border:`1px solid ${level.border}`, color:level.color,
        }}>
          {level.emoji} {level.label}
        </span>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height:1, background:'#E8DDD0', margin:'0 16px' }} />

      {/* ── TL;DR ── */}
      {data.tldr?.length > 0 && (
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'1.2px', textTransform:'uppercase', color:cat.color, marginBottom:10 }}>
            ✦ TL;DR — 30초 요약
          </div>
          <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
            {data.tldr.map((item, i) => (
              <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <div style={{
                  width:20, height:20, borderRadius:6, display:'grid', placeItems:'center',
                  fontSize:11, fontWeight:800, flexShrink:0, marginTop:1,
                  background:cat.light, color:cat.color,
                }}>{i + 1}</div>
                <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, margin:0 }}>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── DIVIDER ── */}
      <div style={{ height:1, background:'#E8DDD0', margin:'0 16px' }} />

      {/* ── BODY or TIPS ── */}
      <div style={{ padding:'14px 16px' }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:'1.2px', textTransform:'uppercase', color:cat.color, marginBottom:10 }}>
          ✦ 자세히 읽기
        </div>

        {/* 실전 팁: tip-card 리스트 */}
        {data.tips && data.tips.length > 0 ? (
          <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
            {data.tips.map((tip, i) => (
              <li key={i} style={{
                display:'flex', alignItems:'flex-start', gap:10,
                background:'#FAF6ED', border:'1px solid #E8DDD0', borderRadius:10, padding:'10px 13px',
              }}>
                <span style={{
                  fontSize:10, fontWeight:800, borderRadius:5, padding:'2px 6px',
                  background:cat.light, color:cat.color, flexShrink:0, marginTop:2,
                }}>TIP {i + 1}</span>
                <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.6 }}>
                  <strong style={{ color:'#1F2937', display:'block', marginBottom:2 }}>{tip.title}</strong>
                  {tip.desc}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          /* 일반 본문 */
          <div style={{ fontSize:13, color:'#4B5563', lineHeight:1.85, wordBreak:'keep-all' }}>
            {(data.body ?? '').split('\n').map((para, i) =>
              para.trim() ? (
                <p key={i} style={{ margin:'0 0 10px' }}>
                  {renderInline(para, cat.color, cat.light)}
                </p>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* ── QUOTE ── */}
      {data.quote && (
        <div style={{
          margin:'0 16px 14px',
          borderLeft:`3px solid ${cat.color}`,
          borderRadius:'0 8px 8px 0',
          background:cat.light,
          padding:'11px 14px',
        }}>
          <p style={{ fontSize:13, fontStyle:'italic', lineHeight:1.65, color:'#6B7280', margin:0 }}>
            &ldquo;{data.quote}&rdquo;
          </p>
          {data.quote_src && (
            <p style={{ fontSize:11, color:'#9CA3AF', marginTop:5, marginBottom:0 }}>{data.quote_src}</p>
          )}
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid #E8DDD0' }}>
        {data.source_url ? (
          <a href={data.source_url} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', gap:5,
            fontSize:12, fontWeight:600, textDecoration:'none', padding:'6px 12px',
            borderRadius:8, border:'1px solid #E8DDD0', color:'#8B7B6B', background:'#FAF6ED',
          }}>🔗 원문 보기</a>
        ) : <div />}
        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={onLike ?? (() => {})}
            style={{
              fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 8,
              border: `1px solid ${likedByMe ? cat.color : '#E8DDD0'}`,
              color: likedByMe ? cat.color : '#6B7280',
              background: likedByMe ? cat.light : 'white',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
            👍{likeCount > 0 ? ` ${likeCount}` : ''}
          </button>
          <button
            onClick={async () => {
              const shareData = {
                title: data.title,
                text: data.tldr?.[0] ?? data.title,
                url: data.source_url ?? window.location.href,
              }
              if (navigator.share) {
                try { await navigator.share(shareData) } catch {}
              } else {
                await navigator.clipboard.writeText(data.source_url ?? window.location.href)
                alert('링크가 복사됐습니다!')
              }
            }}
            style={{
              fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 8,
              border: '1px solid #E8DDD0', color: '#6B7280', background: 'white',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            🔗 공유
          </button>
        </div>
      </div>

    </div>
  )
}
