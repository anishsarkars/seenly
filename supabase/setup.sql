-- Seenly Supabase setup
-- Run in the Supabase SQL editor after creating your project.

-- Profile columns (if migrating from older schema)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name varchar(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL;
ALTER TABLE users ALTER COLUMN bio TYPE varchar(500);

CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country varchar(100),
  device varchar(50),
  browser varchar(50),
  referrer text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS profile_views_profile_id_idx ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS profile_views_created_at_idx ON profile_views(created_at);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true),
  ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for profile media
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Public read videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Public read thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Public read resumes" ON storage.objects
  FOR SELECT USING (bucket_id = 'resumes');

-- Authenticated users upload into their own folder
CREATE POLICY "Users upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload resumes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own thumbnails" ON storage.objects
  FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own resumes" ON storage.objects
  FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Row Level Security for profiles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON users
  FOR SELECT USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public read experiences" ON experiences
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = experiences.user_id AND (users.is_public = true OR users.id = auth.uid()))
  );

CREATE POLICY "Owner write experiences" ON experiences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read projects" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = projects.user_id AND (users.is_public = true OR users.id = auth.uid()))
  );

CREATE POLICY "Owner write projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read socials" ON socials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = socials.user_id AND (users.is_public = true OR users.id = auth.uid()))
  );

CREATE POLICY "Owner write socials" ON socials
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert profile views" ON profile_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can read profile views" ON profile_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = profile_views.profile_id AND users.id = auth.uid())
  );
