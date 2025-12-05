# Groups Feature Implementation PRP

## Executive Summary

This PRP provides comprehensive guidance for implementing a social collaboration feature in the Small Plates application. Groups will enable users to collaborate on recipe collection and cookbook creation with role-based permissions, invitation system, and shared cookbooks.

**Confidence Score: 8.5/10** - High confidence due to extensive codebase patterns and clear requirements.

## Context and Research Findings

### 1. Codebase Architecture Overview

The Small Plates application uses:
- **Frontend**: Next.js 14 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **UI Library**: Radix UI components in `/components/ui/`
- **State**: React hooks, React Query for server state
- **Email**: Postmark for transactional emails

### 2. Critical File References

#### Database and Types
```
/lib/types/database.ts - All TypeScript types matching Supabase schema
/lib/supabase/client.ts - Browser client setup
/lib/supabase/server.ts - Server client with cookies
/supabase/migrations/ - RLS policies examples
```

#### UI Component Patterns
```
/components/profile/recipes/RecipeTable.tsx - Table with TanStack Table
/components/profile/recipes/AddRecipeModal.tsx - Modal with form pattern
/components/profile/cookbook/CookbookTable.tsx - Draggable table example
/components/profile/ProfileNavigation.tsx - Navigation pattern
/components/ui/ - All UI primitives (button, dropdown, sheet, etc.)
```

#### API Routes
```
/app/api/admin/waitlist/invite/route.ts - Email invitation pattern
/app/api/webhooks/postmark/route.ts - Email webhook handling
/lib/postmark.ts - Email client setup
```

### 3. Key Patterns Discovered

#### Type Definition Pattern
```typescript
// In /lib/types/database.ts
export type GroupRow = Database['public']['Tables']['groups']['Row'];
export type GroupInsert = Database['public']['Tables']['groups']['Insert'];
export type GroupUpdate = Database['public']['Tables']['groups']['Update'];

// Extended types for UI
export interface GroupWithMembers extends GroupRow {
  group_members: GroupMemberWithProfile[];
  cookbook?: CookbookRow;
}
```

#### Supabase Function Pattern
```typescript
// In /lib/supabase/groups.ts
export async function createGroup(data: GroupInsert) {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ ...data, created_by: user.id })
    .select()
    .single();
    
  if (error) throw error;
  return { data: group, error: null };
}
```

#### Modal Component Pattern
```typescript
// Based on AddRecipeModal.tsx pattern
export function CreateGroupModal({ 
  open, 
  onOpenChange,
  onGroupCreated 
}: CreateGroupModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  
  // Form handling, validation, submission
  // Responsive Sheet component usage
}
```

### 4. External Documentation References

**Essential Documentation URLs:**
- Supabase RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- TanStack Table v8: https://tanstack.com/table/v8/docs/guide/introduction
- Next.js 14 App Router: https://nextjs.org/docs/app
- Radix UI Primitives: https://www.radix-ui.com/primitives
- Postmark Email API: https://postmarkapp.com/developer

## Implementation Blueprint

### Phase 1: Database Schema and Types

#### 1.1 Create Migration File
```sql
-- /supabase/migrations/[timestamp]_add_groups.sql

-- Create enum types
CREATE TYPE group_visibility AS ENUM ('private', 'public');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  visibility group_visibility DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id),
  PRIMARY KEY (group_id, profile_id)
);

-- Group invitations table
CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add group support to existing tables
ALTER TABLE cookbooks ADD COLUMN is_group_cookbook BOOLEAN DEFAULT FALSE;
ALTER TABLE cookbooks ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE guest_recipes ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_group_members_profile ON group_members(profile_id);
CREATE INDEX idx_group_invitations_token ON group_invitations(token);
CREATE INDEX idx_cookbooks_group ON cookbooks(group_id);

-- RLS Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view groups they are members of" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group owners can update their groups" ON groups
  FOR UPDATE USING (
    created_by = auth.uid() OR
    id IN (
      SELECT group_id FROM group_members 
      WHERE profile_id = auth.uid() AND role = 'owner'
    )
  );

-- Group members policies
CREATE POLICY "Members can view group members" ON group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage group members" ON group_members
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE profile_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

#### 1.2 Update TypeScript Types
```typescript
// Add to /lib/types/database.ts
// Follow existing pattern in the file

export type GroupVisibility = 'private' | 'public';
export type MemberRole = 'owner' | 'admin' | 'member';

// Add to Database interface Tables section
groups: {
  Row: {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    visibility: GroupVisibility;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    description?: string | null;
    created_by?: string;
    visibility?: GroupVisibility;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    description?: string | null;
    created_by?: string;
    visibility?: GroupVisibility;
    created_at?: string;
    updated_at?: string;
  };
};

// Similar for group_members, group_invitations

// Extended types at bottom of file
export interface GroupWithMembers extends GroupRow {
  group_members: GroupMemberWithProfile[];
  cookbook?: CookbookRow;
  recipe_count?: number;
}

export interface GroupMemberWithProfile extends GroupMemberRow {
  profiles: ProfileRow;
}
```

### Phase 2: Supabase Functions

Create these files following the existing pattern:

#### 2.1 /lib/supabase/groups.ts
```typescript
import { createBrowserClient } from './client';
import type { GroupInsert, GroupUpdate, GroupWithMembers } from '@/lib/types/database';

export async function createGroup(data: Omit<GroupInsert, 'created_by'>) {
  const supabase = createBrowserClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  
  // Start transaction - create group and add owner as member
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ ...data, created_by: user.id })
    .select()
    .single();
    
  if (groupError) return { data: null, error: groupError.message };
  
  // Add creator as owner
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      profile_id: user.id,
      role: 'owner'
    });
    
  if (memberError) {
    // Rollback by deleting group
    await supabase.from('groups').delete().eq('id', group.id);
    return { data: null, error: memberError.message };
  }
  
  // Create shared cookbook
  const { error: cookbookError } = await supabase
    .from('cookbooks')
    .insert({
      name: `${group.name} Cookbook`,
      is_group_cookbook: true,
      group_id: group.id
    });
    
  if (cookbookError) {
    console.error('Failed to create group cookbook:', cookbookError);
  }
  
  return { data: group, error: null };
}

export async function getMyGroups(): Promise<{ data: GroupWithMembers[] | null; error: string | null }> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(
        *,
        profiles(*)
      ),
      cookbook:cookbooks(*)
    `)
    .order('created_at', { ascending: false });
    
  if (error) return { data: null, error: error.message };
  
  return { data: data as GroupWithMembers[], error: null };
}

// Add other functions: getGroupById, updateGroup, deleteGroup
```

#### 2.2 /lib/supabase/groupMembers.ts
```typescript
// Similar pattern for member management functions
```

#### 2.3 /lib/supabase/groupRecipes.ts
```typescript
// Functions for managing recipes within groups
```

### Phase 3: UI Components

#### 3.1 Groups Section Component
```typescript
// /components/profile/groups/GroupsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupSelector } from './GroupSelector';
import { GroupMembersDropdown } from './GroupMembersDropdown';
import { GroupRecipeTable } from './GroupRecipeTable';
import { getMyGroups } from '@/lib/supabase/groups';
import type { GroupWithMembers } from '@/lib/types/database';

export function GroupsSection() {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadGroups();
  }, []);
  
  async function loadGroups() {
    setLoading(true);
    const { data, error } = await getMyGroups();
    if (data) {
      setGroups(data);
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
      }
    }
    setLoading(false);
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-serif font-light text-center mb-2">
          My Groups
        </h1>
        <p className="text-lg text-gray-600">Collaborative recipes</p>
      </div>
      
      {/* Controls */}
      <div className="px-4 md:px-8 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedGroup && (
              <>
                <GroupSelector 
                  groups={groups}
                  selectedGroup={selectedGroup}
                  onGroupChange={setSelectedGroup}
                />
                <GroupMembersDropdown group={selectedGroup} />
              </>
            )}
          </div>
          
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="rounded-full w-12 h-12 p-0 bg-sp-primary hover:bg-sp-primary/90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Table Section */}
      {selectedGroup ? (
        <div className="flex-1 px-4 md:px-8">
          <GroupRecipeTable group={selectedGroup} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h3 className="text-2xl font-serif mb-4">No groups yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first group to start collaborating on recipes
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-sp-primary hover:bg-sp-primary/90"
            >
              Create First Group
            </Button>
          </div>
        </div>
      )}
      
      <CreateGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onGroupCreated={loadGroups}
      />
    </div>
  );
}
```

#### 3.2 Create Group Modal
```typescript
// /components/profile/groups/CreateGroupModal.tsx
// Follow pattern from AddRecipeModal.tsx with Sheet component
```

#### 3.3 Group Recipe Table
```typescript
// /components/profile/groups/GroupRecipeTable.tsx
// Extend RecipeTable.tsx with group-specific features
```

### Phase 4: API Routes

#### 4.1 Group Invitation Route
```typescript
// /app/api/groups/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { sendGroupInvitation } from '@/lib/postmark';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { groupId, email, name } = await request.json();
    
    // Validate input
    if (!groupId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check user is admin/owner of group
    const { data: member } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single();
      
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Create invitation
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    const { error: inviteError } = await supabase
      .from('group_invitations')
      .insert({
        group_id: groupId,
        email,
        name,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString()
      });
      
    if (inviteError) {
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }
    
    // Send email
    await sendGroupInvitation({
      to: email,
      name,
      inviterName: user.user_metadata.full_name || 'A friend',
      groupName: 'the group', // Fetch actual group name
      inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/groups/join?token=${token}`
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Group invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Phase 5: Navigation Integration

#### 5.1 Update Profile Navigation
```typescript
// Add to /components/profile/ProfileNavigation.tsx
// In the navigation items array:
{
  label: 'Groups',
  href: '/profile?tab=groups',
  icon: Users, // Import from lucide-react
}
```

#### 5.2 Update Profile Page
```typescript
// In /app/profile/page.tsx or ProfileContent component
// Add groups tab handling:
{activeTab === 'groups' && <GroupsSection />}
```

## Task List (Implementation Order)

1. **Database Setup** (Priority: Critical)
   - [ ] Create and run migration file
   - [ ] Update database types in `/lib/types/database.ts`
   - [ ] Test RLS policies with Supabase dashboard

2. **Supabase Functions** (Priority: High)
   - [ ] Create `/lib/supabase/groups.ts`
   - [ ] Create `/lib/supabase/groupMembers.ts`
   - [ ] Create `/lib/supabase/groupRecipes.ts`
   - [ ] Create `/lib/supabase/groupInvitations.ts`

3. **Core UI Components** (Priority: High)
   - [ ] Create `/components/profile/groups/` directory
   - [ ] Implement `GroupsSection.tsx`
   - [ ] Implement `CreateGroupModal.tsx`
   - [ ] Implement `GroupSelector.tsx`
   - [ ] Implement `GroupMembersDropdown.tsx`

4. **Recipe Table Integration** (Priority: High)
   - [ ] Create `GroupRecipeTable.tsx` extending RecipeTable
   - [ ] Add "Added by" column
   - [ ] Implement group-specific actions

5. **API Routes** (Priority: Medium)
   - [ ] Create `/app/api/groups/invite/route.ts`
   - [ ] Create `/app/api/groups/join/route.ts`

6. **Navigation Integration** (Priority: Medium)
   - [ ] Update ProfileNavigation component
   - [ ] Update profile page tab handling

7. **Additional Features** (Priority: Low)
   - [ ] Implement `InviteMemberModal.tsx`
   - [ ] Add recipe to group dropdown
   - [ ] Group activity indicators

8. **Testing & Polish** (Priority: Low)
   - [ ] Add loading states
   - [ ] Add error handling
   - [ ] Test all user flows

## Validation Gates

### Build Validation
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

### Manual Testing Checklist
- [ ] Create a new group
- [ ] View group members
- [ ] Add a plate to group
- [ ] Switch between groups
- [ ] Invite a member (placeholder)
- [ ] Remove recipe from group
- [ ] Test mobile responsive design
- [ ] Test RLS policies (unauthorized access)

### Database Validation
```sql
-- Test queries to run in Supabase dashboard
-- Check group creation
SELECT * FROM groups WHERE created_by = auth.uid();

-- Check member roles
SELECT * FROM group_members WHERE profile_id = auth.uid();

-- Check group recipes
SELECT * FROM guest_recipes WHERE group_id IS NOT NULL;
```

## Gotchas and Considerations

### 1. RLS Policy Complexity
- Test policies thoroughly in Supabase dashboard
- Consider using database functions for complex permission checks
- Remember policies are AND'd together, not OR'd

### 2. Real-time Subscriptions
- Start with polling, add real-time in Phase 3
- Consider subscription cleanup in useEffect

### 3. Transaction Handling
- Supabase doesn't support client-side transactions
- Use service role for complex operations requiring atomicity

### 4. Type Safety
- Generate types from Supabase: `npx supabase gen types typescript`
- Keep extended types separate from generated ones

### 5. Mobile Responsiveness
- Test Sheet component behavior on mobile
- Consider separate mobile layouts for complex forms

### 6. Email Integration
- Postmark requires verified sender domain
- Use placeholder implementation initially
- Rate limit invitation sending

## Success Criteria

1. **Functional Requirements Met**
   - All user stories from INITIAL_groups.md implemented
   - Groups can be created, managed, deleted
   - Members can be invited (placeholder)
   - Recipes can be shared within groups
   - Shared cookbook automatically created

2. **Technical Requirements**
   - Type-safe implementation
   - RLS policies working correctly
   - Responsive design on all devices
   - No console errors or warnings
   - Build passes without errors

3. **User Experience**
   - Smooth navigation between groups
   - Clear permission indicators
   - Intuitive UI matching existing patterns
   - Loading and error states handled

4. **Code Quality**
   - Follows existing codebase patterns
   - Well-commented complex logic
   - Reusable components created
   - No code duplication

## Confidence Score: 8.5/10

High confidence due to:
- Clear requirements in INITIAL_groups.md
- Extensive existing patterns to follow
- Well-structured codebase
- Comprehensive research completed

Minor uncertainty in:
- Email invitation complexity
- Real-time features implementation
- Complex RLS policies for group permissions

This PRP provides all necessary context for successful one-pass implementation of the Groups feature.