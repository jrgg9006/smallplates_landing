-- Fix infinite recursion in group_members RLS policies
-- The issue: policies were doing SELECT on group_members inside group_members policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.group_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON public.group_members;

-- Recreate policies without recursion

-- SELECT: Users can view members of groups they belong to
-- Using a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.user_group_ids(user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT group_id FROM public.group_members WHERE profile_id = user_id;
$$;

-- SELECT policy using the function
CREATE POLICY "Users can view group members" 
  ON public.group_members 
  FOR SELECT 
  USING (
    group_id IN (SELECT public.user_group_ids(auth.uid()))
  );

-- INSERT: Owners and admins can add members
CREATE OR REPLACE FUNCTION public.user_admin_group_ids(user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT group_id FROM public.group_members WHERE profile_id = user_id AND role IN ('owner', 'admin');
$$;

CREATE POLICY "Owners and admins can add members" 
  ON public.group_members 
  FOR INSERT 
  WITH CHECK (
    group_id IN (SELECT public.user_admin_group_ids(auth.uid()))
  );

-- UPDATE: Users can update their own row (for custom_share_message), admins can update others
CREATE POLICY "Users can update own membership or admins can update others" 
  ON public.group_members 
  FOR UPDATE 
  USING (
    profile_id = auth.uid()  -- Users can always update their own row
    OR group_id IN (SELECT public.user_admin_group_ids(auth.uid()))  -- Admins can update any row in their groups
  );

-- DELETE: Users can leave (delete own row), admins can remove others
CREATE POLICY "Users can leave or admins can remove members" 
  ON public.group_members 
  FOR DELETE 
  USING (
    profile_id = auth.uid()  -- Users can always remove themselves
    OR group_id IN (SELECT public.user_admin_group_ids(auth.uid()))  -- Admins can remove others
  );
