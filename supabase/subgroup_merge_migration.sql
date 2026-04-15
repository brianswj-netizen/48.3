-- ================================================================
-- 중급반 + 고급반 → 실전반 통합 마이그레이션
-- ================================================================

-- 1. chat_rooms: '중급반' 방을 '실전반'으로 이름 변경
UPDATE chat_rooms
SET name = '실전반', subgroup_id = '실전반'
WHERE name = '중급반' AND type = 'subgroup';

-- 2. chat_rooms: '고급반' 방 삭제
DELETE FROM chat_rooms
WHERE name = '고급반' AND type = 'subgroup';

-- 3. users: subgroup 값 통합
UPDATE users
SET subgroup = '실전반'
WHERE subgroup IN ('중급반', '고급반');

-- 4. subgroup_members: 고급반 중 중급반도 있는 유저 중복 방지 후 이름 변경
--    (primary key: user_id + subgroup_id)
DELETE FROM subgroup_members
WHERE subgroup_id = '고급반'
  AND user_id IN (
    SELECT user_id FROM subgroup_members WHERE subgroup_id = '중급반'
  );

UPDATE subgroup_members SET subgroup_id = '실전반' WHERE subgroup_id = '중급반';
UPDATE subgroup_members SET subgroup_id = '실전반' WHERE subgroup_id = '고급반';

-- 5. documents: subgroup_id 통합 (가시성 제한된 문서)
UPDATE documents
SET subgroup_id = '실전반'
WHERE subgroup_id IN ('중급반', '고급반');
