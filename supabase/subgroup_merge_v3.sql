-- ================================================================
-- 실전반 통합 마이그레이션 v3 (처음부터 다시 실행 가능)
-- ================================================================

-- Step 1: 고급반 방의 메시지 먼저 삭제 (FK 제약 해제)
DELETE FROM chat_messages
WHERE room_id IN (
  SELECT id FROM chat_rooms WHERE name = '고급반' AND type = 'subgroup'
);

-- Step 2: 고급반 방 삭제
DELETE FROM chat_rooms
WHERE name = '고급반' AND type = 'subgroup';

-- Step 3: 중급반 → 실전반 이름 변경
UPDATE chat_rooms
SET name = '실전반', subgroup_id = '실전반'
WHERE name = '중급반' AND type = 'subgroup';

-- Step 4: users.subgroup 통합
UPDATE users
SET subgroup = '실전반'
WHERE subgroup IN ('중급반', '고급반');

-- Step 5: subgroup_members 통합
DELETE FROM subgroup_members
WHERE subgroup_id = '고급반'
  AND user_id IN (SELECT user_id FROM subgroup_members WHERE subgroup_id = '중급반');
UPDATE subgroup_members
SET subgroup_id = '실전반'
WHERE subgroup_id IN ('중급반', '고급반');

-- Step 6: documents visibility 통합
UPDATE documents
SET subgroup_id = '실전반'
WHERE subgroup_id IN ('중급반', '고급반');
