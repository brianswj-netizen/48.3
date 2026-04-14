-- AI Survival Crew — 일간 AI 카드 마이그레이션
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- ================================================================
-- 1. daily_cards 테이블
-- ================================================================
CREATE TABLE IF NOT EXISTS daily_cards (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category    TEXT NOT NULL,        -- 'ai_news' | 'tips' | 'deep_article' | 'kr_news'
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  source_url  TEXT,
  tags        TEXT[],               -- 태그 배열
  color       TEXT NOT NULL,        -- 카테고리별 HEX 색상
  card_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  message_id  UUID REFERENCES chat_messages(id),  -- 전체방에 올라간 메시지 ID
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 날짜별 중복 방지 (하루 1개)
CREATE UNIQUE INDEX IF NOT EXISTS daily_cards_date_unique ON daily_cards (card_date);

-- ================================================================
-- 2. 시스템 봇 유저 (일간 카드 발송 전용)
--    kakao_id = 'system_bot' 으로 구별
-- ================================================================
INSERT INTO users (kakao_id, name, nickname, role)
VALUES ('system_bot', 'AI 크루봇', '📰 AI 크루봇', 'admin')
ON CONFLICT (kakao_id) DO NOTHING;
