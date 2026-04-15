-- 메시지 댓글 테이블
CREATE TABLE IF NOT EXISTS message_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_message_comments_message_id ON message_comments(message_id);

ALTER TABLE message_comments ENABLE ROW LEVEL SECURITY;
