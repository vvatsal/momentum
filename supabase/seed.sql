-- Optional SQL seed: run AFTER creating auth users via scripts/seed.ts
-- Sample published test with 10 questions (for local dev after Phase 3 UI)

-- Replace with your admin user id from Supabase Auth
-- \set admin_id '00000000-0000-0000-0000-000000000001'

-- Example (uncomment and set admin_id after seed script):
/*
INSERT INTO public.tests (
  id, title, description, instructions, duration_minutes, status, created_by, published_at
) VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Sample Mathematics Quiz',
  'A 10-question sample test for development.',
  'Answer all questions. You may skip and return later. Submit when finished.',
  45,
  'published',
  :'admin_id',
  now()
) ON CONFLICT DO NOTHING;
*/
