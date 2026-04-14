-- suggestion_comments 테이블 생성
CREATE TABLE IF NOT EXISTS suggestion_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suggestion_comments_suggestion_id ON suggestion_comments(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_author_id ON suggestions(author_id);

-- RLS 비활성화 (admin client 사용하므로 RLS 불필요)
ALTER TABLE suggestion_comments DISABLE ROW LEVEL SECURITY;
