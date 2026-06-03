-- Drop the unique constraint that prevents multiple attempts per test per user
-- This allows admins to take tests multiple times for validation
ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS attempts_one_active_per_test;
