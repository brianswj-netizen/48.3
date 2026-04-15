-- '오늘의 꿀팁과 정보' 채팅방 생성 (type='main' → 전체 멤버 접근)
INSERT INTO chat_rooms (name, type, subgroup_id)
VALUES ('꿀팁과 정보', 'main', null)
ON CONFLICT DO NOTHING;
