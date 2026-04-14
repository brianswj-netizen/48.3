-- mention_notifications: @멘션 알림 테이블
CREATE TABLE IF NOT EXISTS mention_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentioned_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_text TEXT,
  room_name TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mention_notifications ENABLE ROW LEVEL SECURITY;

-- 누구나 삽입 가능 (서비스 역할 사용)
CREATE POLICY "Service can insert mentions" ON mention_notifications
  FOR INSERT WITH CHECK (true);

-- 모든 인증 유저가 읽기 가능 (서버에서 필터링)
CREATE POLICY "Authenticated can read mentions" ON mention_notifications
  FOR SELECT USING (true);

-- 업데이트 (읽음 처리)
CREATE POLICY "Authenticated can update mentions" ON mention_notifications
  FOR UPDATE USING (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS mention_notifications_user_idx
  ON mention_notifications (mentioned_user_id, is_read, created_at DESC);
