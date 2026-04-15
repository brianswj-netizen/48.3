-- ═══════════════════════════════════════════════════════════════════
--  크루 점수 시스템 v1  (Supabase SQL Editor에서 실행)
-- ═══════════════════════════════════════════════════════════════════
--
--  점수 기준 (자동 계산):
--    채팅 메시지         +1점  (하루 최대 10점)
--    채팅 리액션         +0.5점
--    Daily Pick 댓글     +3점
--    공지 댓글           +2점
--    공지 리액션         +1점
--    일정 댓글           +2점
--    제안 댓글           +2점
--    삽질기 댓글         +2점
--    삽질기 글 작성       +10점
--    삽질기 리액션       +0.5점  (하루 최대 5점)
--    제안 등록           +5점
--    제안 공감           +1점
--    제안 해결됨         +15점
--    투표 참여           +3점  (투표당 1회)
--
--  레벨 기준:
--    Lv1 🌱 씨앗      0–49점
--    Lv2 🌿 새싹      50–149점
--    Lv3 ⚡ 크루원    150–349점
--    Lv4 🔥 코어 크루  350–699점
--    Lv5 👑 MVP       700점+
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. 점수 계산 함수 ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calc_crew_score(uid uuid)
RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT (

    -- 채팅 메시지: 하루 최대 10점
    COALESCE((
      SELECT SUM(LEAST(daily_cnt, 10))
      FROM (
        SELECT COUNT(*) AS daily_cnt
        FROM chat_messages
        WHERE sender_id = uid AND (deleted IS NULL OR deleted = false)
        GROUP BY DATE(created_at)
      ) d
    ), 0)

    -- 채팅 리액션 (created_at 없으므로 총합)
    + COALESCE((
      SELECT FLOOR(COUNT(*) * 0.5)
      FROM message_reactions WHERE user_id = uid
    ), 0)

    -- Daily Pick 댓글 (+3)
    + COALESCE((
      SELECT COUNT(*) * 3
      FROM message_comments WHERE user_id = uid
    ), 0)

    -- 공지사항 댓글 (+2)
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM announcement_comments WHERE author_id = uid
    ), 0)

    -- 공지사항 리액션 (+1)
    + COALESCE((
      SELECT COUNT(*)
      FROM announcement_reactions WHERE user_id = uid
    ), 0)

    -- 일정 댓글 (+2)
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM event_comments WHERE author_id = uid
    ), 0)

    -- 제안 댓글 (+2)
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM suggestion_comments WHERE author_id = uid
    ), 0)

    -- 삽질기 댓글 (+2)
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM sapjil_comments WHERE user_id = uid
    ), 0)

    -- 삽질기 글 작성 (+10)
    + COALESCE((
      SELECT COUNT(*) * 10
      FROM sapjil_posts WHERE author_id = uid
    ), 0)

    -- 삽질기 리액션: 하루 최대 5점
    + COALESCE((
      SELECT SUM(LEAST(daily_cnt, 5))
      FROM (
        SELECT COUNT(*) AS daily_cnt
        FROM sapjil_reactions WHERE user_id = uid
        GROUP BY DATE(created_at)
      ) d
    ), 0)

    -- 제안 등록 (+5)
    + COALESCE((
      SELECT COUNT(*) * 5
      FROM suggestions WHERE author_id = uid
    ), 0)

    -- 제안 공감 (+1)
    + COALESCE((
      SELECT COUNT(*)
      FROM suggestion_likes WHERE user_id = uid
    ), 0)

    -- 내 제안 해결됨 (+15)
    + COALESCE((
      SELECT COUNT(*) * 15
      FROM suggestions
      WHERE author_id = uid AND status IN ('resolved', 'accepted')
    ), 0)

    -- 투표 참여 (+3, 투표당 1회)
    + COALESCE((
      SELECT COUNT(DISTINCT vote_id) * 3
      FROM vote_responses WHERE user_id = uid
    ), 0)

  )::integer
$$;


-- ── 2. 레벨 계산 함수 ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calc_crew_level(score integer)
RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN score >= 700 THEN 5  -- 👑 MVP
    WHEN score >= 350 THEN 4  -- 🔥 코어 크루
    WHEN score >= 150 THEN 3  -- ⚡ 크루원
    WHEN score >= 50  THEN 2  -- 🌿 새싹
    ELSE                   1  -- 🌱 씨앗
  END
$$;


-- ── 3. 전체 멤버 점수 일괄 갱신 함수 ─────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_all_crew_scores()
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  u RECORD;
  new_score integer;
  new_level integer;
BEGIN
  FOR u IN
    SELECT id FROM users
    WHERE status = 'approved'
      AND kakao_id NOT LIKE 'pre_%'
      AND kakao_id NOT LIKE 'system_%'
  LOOP
    new_score := calc_crew_score(u.id);
    new_level := calc_crew_level(new_score);
    UPDATE users SET score = new_score, level = new_level WHERE id = u.id;
  END LOOP;
END;
$$;


-- ── 4. 현재 데이터 기준으로 즉시 갱신 ───────────────────────────
SELECT recalculate_all_crew_scores();


-- ── 5. 확인용 조회 ───────────────────────────────────────────────
SELECT
  name,
  score,
  level,
  CASE level
    WHEN 5 THEN '👑 MVP'
    WHEN 4 THEN '🔥 코어 크루'
    WHEN 3 THEN '⚡ 크루원'
    WHEN 2 THEN '🌿 새싹'
    ELSE        '🌱 씨앗'
  END AS level_name
FROM users
WHERE status = 'approved' AND kakao_id NOT LIKE 'pre_%' AND kakao_id NOT LIKE 'system_%'
ORDER BY score DESC;
