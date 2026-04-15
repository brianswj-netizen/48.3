-- ════════════════════════════════════════════════════════════════
--  크루 점수 시스템 v2  (점수 0.1 배율 조정 + 레벨 임계값 상향)
--  Supabase SQL Editor → 전체 선택 → Run
-- ════════════════════════════════════════════════════════════════
--
--  변경사항:
--    · 모든 점수 × 0.1 배율 적용 (소수 1자리)
--    · 레벨 임계값 대폭 상향 → 시즌 전체 통해 천천히 성장
--    · users.score 컬럼: integer → NUMERIC(6,1)
--
--  점수 기준:
--    채팅 메시지         +0.1점  (하루 최대 1점)
--    채팅 리액션         +0.05점
--    Daily Pick 댓글     +0.3점
--    공지사항 댓글        +0.2점
--    공지사항 리액션      +0.1점
--    일정 댓글           +0.2점
--    제안 댓글           +0.2점
--    삽질기 댓글         +0.2점
--    삽질기 글 작성       +1.0점
--    삽질기 리액션       +0.05점  (하루 최대 0.5점)
--    제안 등록           +0.5점
--    제안 공감           +0.1점
--    제안 해결됨         +1.5점
--    투표 참여           +0.3점  (투표당 1회)
--
--  레벨 기준:
--    Lv1 🌱 씨앗        0 – 29점
--    Lv2 🌿 새싹        30 – 99점
--    Lv3 ⚡ 크루원      100 – 249점
--    Lv4 🔥 코어 크루   250 – 499점
--    Lv5 👑 MVP         500점 이상
-- ════════════════════════════════════════════════════════════════


-- ── 1. score 컬럼 타입 변경 + 기존 점수 /10 변환 ─────────────────
ALTER TABLE users
  ALTER COLUMN score TYPE NUMERIC(6,1)
  USING ROUND(score::NUMERIC / 10, 1);


-- ── 2. 점수 계산 함수 ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calc_crew_score(uid uuid)
RETURNS NUMERIC(6,1)
LANGUAGE sql STABLE AS $$
  SELECT ROUND((

    -- 채팅 메시지: 하루 최대 1점 (0.1 × 최대 10회)
    COALESCE((
      SELECT SUM(LEAST(daily_cnt, 10)) * 0.1
      FROM (
        SELECT COUNT(*) AS daily_cnt
        FROM chat_messages
        WHERE sender_id = uid AND (deleted IS NULL OR deleted = false)
        GROUP BY DATE(created_at)
      ) d
    ), 0)

    -- 채팅 리액션: +0.05점 (created_at 없으므로 총합)
    + COALESCE((
      SELECT FLOOR(COUNT(*) * 0.5) * 0.1
      FROM message_reactions WHERE user_id = uid
    ), 0)

    -- Daily Pick 댓글: +0.3점
    + COALESCE((
      SELECT COUNT(*) * 0.3
      FROM message_comments WHERE user_id = uid
    ), 0)

    -- 공지사항 댓글: +0.2점
    + COALESCE((
      SELECT COUNT(*) * 0.2
      FROM announcement_comments WHERE author_id = uid
    ), 0)

    -- 공지사항 리액션: +0.1점
    + COALESCE((
      SELECT COUNT(*) * 0.1
      FROM announcement_reactions WHERE user_id = uid
    ), 0)

    -- 일정 댓글: +0.2점
    + COALESCE((
      SELECT COUNT(*) * 0.2
      FROM event_comments WHERE author_id = uid
    ), 0)

    -- 제안 댓글: +0.2점
    + COALESCE((
      SELECT COUNT(*) * 0.2
      FROM suggestion_comments WHERE author_id = uid
    ), 0)

    -- 삽질기 댓글: +0.2점
    + COALESCE((
      SELECT COUNT(*) * 0.2
      FROM sapjil_comments WHERE user_id = uid
    ), 0)

    -- 삽질기 글 작성: +1.0점
    + COALESCE((
      SELECT COUNT(*) * 1.0
      FROM sapjil_posts WHERE author_id = uid
    ), 0)

    -- 삽질기 리액션: 하루 최대 0.5점 (0.05 × 최대 10회)
    + COALESCE((
      SELECT SUM(LEAST(daily_cnt, 10)) * 0.05
      FROM (
        SELECT COUNT(*) AS daily_cnt
        FROM sapjil_reactions WHERE user_id = uid
        GROUP BY DATE(created_at)
      ) d
    ), 0)

    -- 제안 등록: +0.5점
    + COALESCE((
      SELECT COUNT(*) * 0.5
      FROM suggestions WHERE author_id = uid
    ), 0)

    -- 제안 공감: +0.1점
    + COALESCE((
      SELECT COUNT(*) * 0.1
      FROM suggestion_likes WHERE user_id = uid
    ), 0)

    -- 내 제안 해결됨: +1.5점
    + COALESCE((
      SELECT COUNT(*) * 1.5
      FROM suggestions
      WHERE author_id = uid AND status IN ('resolved', 'accepted')
    ), 0)

    -- 투표 참여: +0.3점 (투표당 1회)
    + COALESCE((
      SELECT COUNT(DISTINCT vote_id) * 0.3
      FROM vote_responses WHERE user_id = uid
    ), 0)

  )::NUMERIC, 1)
$$;


-- ── 3. 레벨 계산 함수 ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calc_crew_level(score NUMERIC)
RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN score >= 500 THEN 5  -- 👑 MVP
    WHEN score >= 250 THEN 4  -- 🔥 코어 크루
    WHEN score >= 100 THEN 3  -- ⚡ 크루원
    WHEN score >= 30  THEN 2  -- 🌿 새싹
    ELSE                   1  -- 🌱 씨앗
  END
$$;


-- ── 4. 전체 멤버 점수 일괄 갱신 ──────────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_all_crew_scores()
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  u RECORD;
  new_score NUMERIC(6,1);
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


-- ── 5. 즉시 갱신 ────────────────────────────────────────────────
SELECT recalculate_all_crew_scores();


-- ── 6. 결과 확인 ────────────────────────────────────────────────
SELECT
  name,
  score || '점' AS score,
  CASE level
    WHEN 5 THEN '👑 MVP'
    WHEN 4 THEN '🔥 코어 크루'
    WHEN 3 THEN '⚡ 크루원'
    WHEN 2 THEN '🌿 새싹'
    ELSE        '🌱 씨앗'
  END AS level_name
FROM users
WHERE status = 'approved'
  AND kakao_id NOT LIKE 'pre_%'
  AND kakao_id NOT LIKE 'system_%'
ORDER BY score DESC;
