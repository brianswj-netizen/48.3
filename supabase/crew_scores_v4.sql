-- ════════════════════════════════════════════════════════════════
--  크루 점수 시스템 v4  (나의 피조물 추가 + 삽질기 점수 상향)
--  Supabase SQL Editor → 전체 선택 → Run
-- ════════════════════════════════════════════════════════════════
--
--  변경사항 (v3 → v4):
--    · 삽질기 글 작성: +10점 → +30점
--    · 나의 피조물 등록: +50점 (신규)
--    · 피조물 댓글: +2점 (신규)
--    · 피조물 리액션: +0.5점 (신규)
--
--  점수 기준:
--    채팅 메시지          +1점   (하루 최대 10점)
--    채팅 리액션          +0.5점
--    Daily Pick 댓글      +3점
--    공지사항 댓글         +2점
--    공지사항 리액션       +1점
--    일정 댓글            +2점
--    제안 댓글            +2점
--    삽질기 댓글          +2점
--    삽질기 글 작성        +30점  ← 변경
--    삽질기 리액션        +0.5점  (하루 최대 5점)
--    제안 등록            +5점
--    제안 공감            +1점
--    제안 해결됨          +15점
--    투표 참여            +3점   (투표당 1회)
--    나의 피조물 등록      +50점  ← 신규
--    피조물 댓글          +2점   ← 신규
--    피조물 리액션        +0.5점  ← 신규
-- ════════════════════════════════════════════════════════════════


-- ── 1. 점수 계산 함수 업데이트 ───────────────────────────────────
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

    -- 채팅 리액션: +0.5점
    + COALESCE((
      SELECT FLOOR(COUNT(*) * 0.5)::integer
      FROM message_reactions WHERE user_id = uid
    ), 0)

    -- Daily Pick 댓글: +3점
    + COALESCE((
      SELECT COUNT(*) * 3
      FROM message_comments WHERE user_id = uid
    ), 0)

    -- 공지사항 댓글: +2점
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM announcement_comments WHERE author_id = uid
    ), 0)

    -- 공지사항 리액션: +1점
    + COALESCE((
      SELECT COUNT(*) * 1
      FROM announcement_reactions WHERE user_id = uid
    ), 0)

    -- 일정 댓글: +2점
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM event_comments WHERE author_id = uid
    ), 0)

    -- 제안 댓글: +2점
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM suggestion_comments WHERE author_id = uid
    ), 0)

    -- 삽질기 댓글: +2점
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM sapjil_comments WHERE user_id = uid
    ), 0)

    -- 삽질기 글 작성: +30점 (v3: 10점 → v4: 30점)
    + COALESCE((
      SELECT COUNT(*) * 30
      FROM sapjil_posts WHERE author_id = uid
    ), 0)

    -- 삽질기 리액션: 하루 최대 5점
    + COALESCE((
      SELECT FLOOR(SUM(LEAST(daily_cnt, 10)) * 0.5)::integer
      FROM (
        SELECT COUNT(*) AS daily_cnt
        FROM sapjil_reactions WHERE user_id = uid
        GROUP BY DATE(created_at)
      ) d
    ), 0)

    -- 제안 등록: +5점
    + COALESCE((
      SELECT COUNT(*) * 5
      FROM suggestions WHERE author_id = uid
    ), 0)

    -- 제안 공감: +1점
    + COALESCE((
      SELECT COUNT(*) * 1
      FROM suggestion_likes WHERE user_id = uid
    ), 0)

    -- 내 제안 해결됨: +15점
    + COALESCE((
      SELECT COUNT(*) * 15
      FROM suggestions
      WHERE author_id = uid AND status IN ('resolved', 'accepted')
    ), 0)

    -- 투표 참여: +3점 (투표당 1회)
    + COALESCE((
      SELECT COUNT(DISTINCT vote_id) * 3
      FROM vote_responses WHERE user_id = uid
    ), 0)

    -- 나의 피조물 등록: +50점 (신규)
    + COALESCE((
      SELECT COUNT(*) * 50
      FROM creatures WHERE author_id = uid
    ), 0)

    -- 피조물 댓글: +2점 (신규)
    + COALESCE((
      SELECT COUNT(*) * 2
      FROM creature_comments WHERE user_id = uid
    ), 0)

    -- 피조물 리액션: +0.5점 (신규)
    + COALESCE((
      SELECT FLOOR(COUNT(*) * 0.5)::integer
      FROM creature_reactions WHERE user_id = uid
    ), 0)

  )::integer
$$;


-- ── 2. 즉시 전체 점수 갱신 ──────────────────────────────────────
SELECT recalculate_all_crew_scores();


-- ── 3. 결과 확인 ────────────────────────────────────────────────
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
