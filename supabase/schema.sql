-- AI Survival Crew — Supabase 스키마
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- ================================================================
-- 1. users
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kakao_id    TEXT UNIQUE NOT NULL,
  name        TEXT,                    -- 최초 로그인 시 직접 입력 (실명)
  nickname    TEXT,                    -- 카카오 닉네임
  avatar_url  TEXT,                    -- 카카오 프로필 사진
  role        TEXT DEFAULT 'member',   -- 'admin' | 'member'
  level       INTEGER DEFAULT 1,       -- 1~6
  score       INTEGER DEFAULT 0,       -- 활동지수
  bio         TEXT,                    -- 자기소개
  subgroup    TEXT,                    -- '입문반' | '중급반' | '고급반'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. announcements (공지사항)
-- ================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 3. events (일정)
-- ================================================================
CREATE TABLE IF NOT EXISTS events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  place       TEXT,
  event_date  DATE NOT NULL,
  event_time  TIME,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 4. chat_rooms
-- ================================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,  -- 'main' | 'subgroup'
  subgroup_id TEXT            -- 소모임 식별자 (subgroup_members.subgroup_id)
);

-- 기본 채팅방 삽입
INSERT INTO chat_rooms (name, type) VALUES ('전체방', 'main') ON CONFLICT DO NOTHING;
INSERT INTO chat_rooms (name, type, subgroup_id) VALUES ('입문반', 'subgroup', '입문반') ON CONFLICT DO NOTHING;
INSERT INTO chat_rooms (name, type, subgroup_id) VALUES ('중급반', 'subgroup', '중급반') ON CONFLICT DO NOTHING;
INSERT INTO chat_rooms (name, type, subgroup_id) VALUES ('고급반', 'subgroup', '고급반') ON CONFLICT DO NOTHING;

-- ================================================================
-- 5. chat_messages
-- ================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id     UUID NOT NULL REFERENCES chat_rooms(id),
  sender_id   UUID NOT NULL REFERENCES users(id),
  text        TEXT NOT NULL,
  edited      BOOLEAN DEFAULT FALSE,
  deleted     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 6. message_reactions (이모지 리액션)
-- ================================================================
CREATE TABLE IF NOT EXISTS message_reactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id  UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  emoji       TEXT NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- ================================================================
-- 7. documents (자료실)
-- ================================================================
CREATE TABLE IF NOT EXISTS documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  tag         TEXT,           -- '텍스트AI' | '이미지AI' | '자동화' | '부동산×AI'
  visibility  TEXT DEFAULT 'all',  -- 'all' | 'subgroup'
  subgroup_id TEXT,
  uploader_id UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 8. photos (사진첩)
-- ================================================================
CREATE TABLE IF NOT EXISTS photos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url         TEXT NOT NULL,
  uploader_id UUID REFERENCES users(id),
  room_id     UUID REFERENCES chat_rooms(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 9. suggestions (제안 게시판)
-- ================================================================
CREATE TABLE IF NOT EXISTS suggestions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  author_id   UUID REFERENCES users(id),
  status      TEXT DEFAULT 'open',  -- 'open' | 'accepted' | 'closed'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 10. votes (투표)
-- ================================================================
CREATE TABLE IF NOT EXISTS votes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  deadline    TIMESTAMPTZ,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vote_options (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id     UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  votes       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vote_responses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id     UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  option_id   UUID NOT NULL REFERENCES vote_options(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  UNIQUE(vote_id, user_id)
);

-- ================================================================
-- 11. notifications
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL,  -- 'announcement' | 'event' | 'mention' | 'document' | 'vote'
  content     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 12. subgroup_members
-- ================================================================
CREATE TABLE IF NOT EXISTS subgroup_members (
  user_id     UUID NOT NULL REFERENCES users(id),
  subgroup_id TEXT NOT NULL,  -- '입문반' | '중급반' | '고급반'
  PRIMARY KEY (user_id, subgroup_id)
);

-- ================================================================
-- RLS (Row Level Security) — 기본 설정
-- ================================================================

-- users: 본인만 수정 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (true); -- service role이 처리

-- 나머지 테이블은 서비스 롤(next.js 서버)에서 처리하므로 RLS 비활성화 상태 유지
-- (필요 시 단계별로 추가)
