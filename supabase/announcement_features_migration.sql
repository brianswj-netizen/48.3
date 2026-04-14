CREATE TABLE IF NOT EXISTS announcement_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '👍',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id, emoji)
);
ALTER TABLE announcement_reactions DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS announcement_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE announcement_comments DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ann_reactions_ann ON announcement_reactions(announcement_id);
CREATE INDEX IF NOT EXISTS idx_ann_comments_ann ON announcement_comments(announcement_id);
