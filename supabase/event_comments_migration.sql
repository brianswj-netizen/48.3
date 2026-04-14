CREATE TABLE IF NOT EXISTS event_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE event_comments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);
