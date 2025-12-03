## FEATURE:

Groups Feature - Social collaboration for recipe collection and cookbook creation

The Groups feature enables users to create collaborative spaces where multiple people can contribute recipes, share collections, and work together on cookbook projects. Each group automatically creates a shared cookbook accessible to all members.

### Core Functionality:
- Create and manage groups with multiple members
- Collaborative recipe collection within groups
- Automatic shared cookbook creation for each group
- Role-based permissions (owner, admin, member)
- Invite friends via email to join groups
- Group-specific recipe tables and management
- Recipe discovery and personal collection from group recipes

## ARCHITECTURE:

### Database Schema:

**New Tables:**
- `groups` - Store group information
  - id, name, description, created_by (profile_id), created_at, updated_at
  
- `group_members` - Manage group membership
  - group_id, profile_id, role (owner/admin/member), joined_at, invited_by
  
- `group_recipes` - Link recipes to groups
  - group_id, recipe_id, added_by (profile_id), added_at
  
- `group_invitations` - Handle pending invitations
  - id, group_id, email, name, invited_by, status, token, expires_at

**Modifications to Existing Tables:**
- `cookbooks` - Add `is_group_cookbook`, `group_id` columns
- `guest_recipes` - Add `group_id` column (nullable)

### Components:

**New Components:**
- `components/profile/groups/GroupsSection.tsx` - Main groups section container
- `components/profile/groups/GroupRecipeTable.tsx` - Table for group recipes (based on RecipeTable.tsx)
- `components/profile/groups/CreateGroupModal.tsx` - Modal for creating new groups
- `components/profile/groups/InviteMemberModal.tsx` - Modal for inviting members
- `components/profile/groups/GroupMembersDropdown.tsx` - Dropdown showing group members
- `components/profile/groups/GroupSelector.tsx` - Dropdown for selecting/switching groups
- `components/profile/groups/AddRecipeToGroupDropdown.tsx` - Dropdown for adding recipes

**Modified Components:**
- `components/profile/ProfileNavTabs.tsx` - Add "Groups" tab
- `components/profile/recipes/RecipeDetailsModal.tsx` - Add "Add to Group" option
- `components/profile/cookbook/CookbookTable.tsx` - Handle shared cookbook indicator

## EXAMPLES:

### User Flow Examples:

**1. Creating a Group:**
```
User → Groups Tab → Click "+" button → CreateGroupModal opens
→ Enter "Friends" as group name → Submit
→ New group created with empty GroupRecipeTable
→ Shared cookbook "Friends Cookbook" automatically created
```

**2. Adding Recipes to Group:**
```
User → In Groups section → Click "Add recipes to this group"
→ Dropdown shows: "Add a new recipe" | "Add existing recipe"
→ Selects "Add a new recipe" → Recipe form
→ Recipe added to both group and user's personal collection
```

**3. Inviting Members:**
```
User → Click "Invite a friend to this group"
→ InviteMemberModal opens
→ Enter Name: "Ana", Email: "ana@example.com"
→ Click "Invite Friend"
→ Email sent with invitation link
```

**4. Member Joining:**
```
Ana → Receives email → Clicks link → Creates account/logs in
→ Automatically added to "Friends" group
→ Sees all group recipes and shared cookbook
```

### Component References:

- Recipe table structure: `@components/profile/recipes/RecipeTable.tsx`
- Cookbook table structure: `@components/profile/cookbook/CookbookTable.tsx`
- Modal patterns: `@components/profile/recipes/AddRecipeModal.tsx`
- Navigation tabs: `@components/profile/ProfileNavTabs.tsx`
- Dropdown patterns: `@components/ui/dropdown-menu.tsx`

## DOCUMENTATION:

### Supabase Functions:

**Groups Management:**
```typescript
// lib/supabase/groups.ts
- createGroup(name, description)
- getMyGroups()
- getGroupById(groupId)
- updateGroup(groupId, data)
- deleteGroup(groupId)

// lib/supabase/groupMembers.ts
- addGroupMember(groupId, profileId, role)
- removeGroupMember(groupId, profileId)
- updateMemberRole(groupId, profileId, role)
- getGroupMembers(groupId)

// lib/supabase/groupRecipes.ts
- addRecipeToGroup(groupId, recipeId)
- removeRecipeFromGroup(groupId, recipeId)
- getGroupRecipes(groupId)
- copyRecipeToPersonal(recipeId)

// lib/supabase/groupInvitations.ts
- createInvitation(groupId, email, name)
- processInvitation(token)
- getPendingInvitations(groupId)
```

### API Routes:

```typescript
// app/api/groups/invite/route.ts
- POST: Send invitation email

// app/api/groups/join/route.ts
- POST: Process invitation link
```

### Permissions Model:

**Owner**: Full control (delete group, manage all members, all actions)
**Admin**: Manage members, add/remove recipes, edit group info
**Member**: Add/remove own recipes, view all content

## OTHER CONSIDERATIONS:

### UI/UX Details:

**Hero Section:**
- Title: "My Groups"
- Subtitle: "Collaborative recipes"

**Buttons Layout:**
- Green circle "+" button (right side) - Create new group
- "Members" dropdown (left of + button) - View group members
- Above table: "Invite a friend" | "Add recipes to this group" | Groups dropdown

**Shared Cookbook Indicator:**
- Text above table: "Shared Cookbook: [Group Name] Cookbook"

**Table Features:**
- Same columns as RecipeTable with additional "Added by" column
- Recipe actions: "Add to my recipes" | "Remove from group" (own recipes only)
- Click recipe to view details (RecipeDetailsModal)

### Technical Considerations:

1. **RLS Policies**: Implement Row Level Security for all group-related tables
2. **Real-time Updates**: Consider Supabase real-time subscriptions for live collaboration
3. **Email Service**: Configure email provider for invitations (placeholder implementation)
4. **Permissions Checks**: Validate permissions on both client and server
5. **Migration Strategy**: 
   - Phase 1: Core groups functionality
   - Phase 2: Invitation system
   - Phase 3: Advanced features (notifications, activity feed)

### Edge Cases:

- User leaves/deletes account - reassign ownership or archive group
- Last owner leaves - promote admin or delete group
- Duplicate recipe names in group - allow but show contributor
- Recipe removed from group - also remove from shared cookbook
- Group deletion - handle shared cookbook and recipes cleanup

### Security:

- Invitation tokens expire after 7 days
- Email verification for new users joining via invitation
- Rate limiting on invitation sending
- Audit log for group actions

### Future Enhancements:

- Group activity feed
- Recipe commenting within groups
- Group-specific tags/categories
- Export group cookbook
- Group recipe approval workflow
- Member contribution statistics