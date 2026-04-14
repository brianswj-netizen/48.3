-- AI Survival Crew — daily_cards v2 마이그레이션
-- Supabase 대시보드 > SQL Editor에서 실행하세요

ALTER TABLE daily_cards
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS level       TEXT DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS tldr        TEXT[],
  ADD COLUMN IF NOT EXISTS body        TEXT,
  ADD COLUMN IF NOT EXISTS tips        JSONB,   -- 실전 팁 카테고리용 [{title, desc}]
  ADD COLUMN IF NOT EXISTS quote       TEXT,
  ADD COLUMN IF NOT EXISTS quote_src   TEXT;
