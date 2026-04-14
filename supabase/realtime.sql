-- Supabase Realtime 활성화
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- chat_messages 테이블 Realtime 활성화
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
