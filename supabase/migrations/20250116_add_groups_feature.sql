-- Add groups feature for collaborative recipe collection
-- This migration creates the infrastructure for users to create groups,
-- invite members, share recipes, and manage collaborative cookbooks.

-- Create enum types for groups
CREATE TYPE group_visibility AS ENUM ('private', 'public');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

-- Groups table - stores group information
CREATE TABLE IF NOT EXISTS public.groups (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Group identification
  name TEXT NOT NULL,                           -- Group name
  description TEXT,                             -- Optional group description
  
  -- Foreign key to user who created the group
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Group settings
  visibility group_visibility DEFAULT 'private',   -- Group visibility (private/public)
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When group was created
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- Last group update
);

-- Add comments to groups table
COMMENT ON TABLE public.groups IS 'Groups for collaborative recipe collection and cookbook creation';
COMMENT ON COLUMN public.groups.id IS 'UUID primary key for the group';
COMMENT ON COLUMN public.groups.name IS 'Display name of the group';
COMMENT ON COLUMN public.groups.description IS 'Optional description of the group purpose';
COMMENT ON COLUMN public.groups.created_by IS 'User who created the group (foreign key to profiles.id)';
COMMENT ON COLUMN public.groups.visibility IS 'Group visibility setting (private or public)';
COMMENT ON COLUMN public.groups.created_at IS 'Timestamp when the group was created';
COMMENT ON COLUMN public.groups.updated_at IS 'Timestamp when the group was last updated';

-- Group members table - manages group membership and roles
CREATE TABLE IF NOT EXISTS public.group_members (
  -- Composite primary key
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Member information
  role member_role NOT NULL DEFAULT 'member',     -- Member role (owner/admin/member)
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When member joined
  invited_by UUID REFERENCES public.profiles(id), -- Who invited this member (optional)
  
  -- Primary key constraint
  PRIMARY KEY (group_id, profile_id)
);

-- Add comments to group_members table
COMMENT ON TABLE public.group_members IS 'Group membership and role management';
COMMENT ON COLUMN public.group_members.group_id IS 'Foreign key to groups table';
COMMENT ON COLUMN public.group_members.profile_id IS 'Foreign key to profiles table';
COMMENT ON COLUMN public.group_members.role IS 'Member role in the group (owner, admin, or member)';
COMMENT ON COLUMN public.group_members.joined_at IS 'Timestamp when the member joined the group';
COMMENT ON COLUMN public.group_members.invited_by IS 'User who invited this member (foreign key to profiles.id)';

-- Group invitations table - handles pending group invitations
CREATE TABLE IF NOT EXISTS public.group_invitations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to group
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  
  -- Invitation details
  email TEXT NOT NULL,                            -- Invitee's email address
  name TEXT,                                      -- Invitee's name (optional)
  
  -- Foreign key to inviter
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Invitation status and tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT UNIQUE NOT NULL,                     -- Unique token for invitation link
  expires_at TIMESTAMPTZ NOT NULL,              -- When invitation expires
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- When invitation was created
);

-- Add comments to group_invitations table
COMMENT ON TABLE public.group_invitations IS 'Pending invitations to join groups';
COMMENT ON COLUMN public.group_invitations.id IS 'UUID primary key for the invitation';
COMMENT ON COLUMN public.group_invitations.group_id IS 'Foreign key to groups table';
COMMENT ON COLUMN public.group_invitations.email IS 'Email address of the invited user';
COMMENT ON COLUMN public.group_invitations.name IS 'Name of the invited user';
COMMENT ON COLUMN public.group_invitations.invited_by IS 'User who sent the invitation (foreign key to profiles.id)';
COMMENT ON COLUMN public.group_invitations.status IS 'Current status of the invitation (pending, accepted, declined, expired)';
COMMENT ON COLUMN public.group_invitations.token IS 'Unique token used in invitation link';
COMMENT ON COLUMN public.group_invitations.expires_at IS 'Timestamp when the invitation expires';
COMMENT ON COLUMN public.group_invitations.created_at IS 'Timestamp when the invitation was created';

-- Add group support to existing tables
-- Add columns to cookbooks table for group cookbook support
ALTER TABLE public.cookbooks ADD COLUMN IF NOT EXISTS is_group_cookbook BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cookbooks ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Add columns to guest_recipes table for group recipe support
ALTER TABLE public.guest_recipes ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Add comments for new columns
COMMENT ON COLUMN public.cookbooks.is_group_cookbook IS 'Boolean flag indicating if this is a shared group cookbook';
COMMENT ON COLUMN public.cookbooks.group_id IS 'Foreign key to groups table for group cookbooks';
COMMENT ON COLUMN public.guest_recipes.group_id IS 'Foreign key to groups table for recipes shared within a group';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_profile ON public.group_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_token ON public.group_invitations(token);
CREATE INDEX IF NOT EXISTS idx_group_invitations_email ON public.group_invitations(email);
CREATE INDEX IF NOT EXISTS idx_cookbooks_group ON public.cookbooks(group_id);
CREATE INDEX IF NOT EXISTS idx_guest_recipes_group ON public.guest_recipes(group_id);

-- Enable Row Level Security on new tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Groups table RLS policies
-- Users can view groups they are members of
CREATE POLICY "Users can view groups they are members of" 
  ON public.groups 
  FOR SELECT 
  USING (
    id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid()
    )
  );

-- Users can create new groups
CREATE POLICY "Users can create groups" 
  ON public.groups 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

-- Group owners and admins can update group information
CREATE POLICY "Group owners and admins can update groups" 
  ON public.groups 
  FOR UPDATE 
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Group owners can delete groups
CREATE POLICY "Group owners can delete groups" 
  ON public.groups 
  FOR DELETE 
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

-- Group members table RLS policies
-- Users can view members of groups they belong to
CREATE POLICY "Users can view group members" 
  ON public.group_members 
  FOR SELECT 
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid()
    )
  );

-- Group owners and admins can add members
CREATE POLICY "Group owners and admins can add members" 
  ON public.group_members 
  FOR INSERT 
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Group owners and admins can update member roles
CREATE POLICY "Group owners and admins can update member roles" 
  ON public.group_members 
  FOR UPDATE 
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Group owners and admins can remove members (members can also leave)
CREATE POLICY "Group owners and admins can remove members" 
  ON public.group_members 
  FOR DELETE 
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR profile_id = auth.uid() -- Users can remove themselves (leave group)
  );

-- Group invitations table RLS policies
-- Users can view invitations for groups they can manage
CREATE POLICY "Group managers can view invitations" 
  ON public.group_invitations 
  FOR SELECT 
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Group owners and admins can create invitations
CREATE POLICY "Group owners and admins can create invitations" 
  ON public.group_invitations 
  FOR INSERT 
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND invited_by = auth.uid()
  );

-- Group owners and admins can update invitations
CREATE POLICY "Group owners and admins can update invitations" 
  ON public.group_invitations 
  FOR UPDATE 
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Group owners and admins can delete invitations
CREATE POLICY "Group owners and admins can delete invitations" 
  ON public.group_invitations 
  FOR DELETE 
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Create a function to automatically create group cookbook when group is created
CREATE OR REPLACE FUNCTION create_group_cookbook()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a shared cookbook for the new group
  INSERT INTO public.cookbooks (name, user_id, is_group_cookbook, group_id)
  VALUES (NEW.name || ' Cookbook', NEW.created_by, TRUE, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create cookbook when group is created
CREATE TRIGGER create_group_cookbook_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION create_group_cookbook();

-- Create a function to automatically add group creator as owner
CREATE OR REPLACE FUNCTION add_group_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the group creator as owner in group_members table
  INSERT INTO public.group_members (group_id, profile_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add creator as owner
CREATE TRIGGER add_group_creator_as_owner_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION add_group_creator_as_owner();