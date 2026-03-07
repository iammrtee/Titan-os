-- Fix infinite recursion in users table RLS policies
-- The issue was that the policy "Admins can view all users" did a SELECT on public.users,
-- which triggered the policy again, resulting in an infinite loop.

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;

-- 2. Create safer policies that check the `auth.users` raw_app_meta_data or use a security definer function, 
-- or simply remove the admin policies for now since Phase 1 doesn't have an admin dashboard.
-- For TitanOS Phase 1, we will stick to owner-only access for simplicity and stability.

-- Re-apply owner-only access for users (just in case they were dropped)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Projects already has "Users can CRUD own projects", which is sufficient and safe.
