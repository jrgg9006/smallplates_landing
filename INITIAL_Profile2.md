## FEATURE:

Redesign the **User Profile Page (Guest List)** where users manage and track their personalized cookbook guests.

**Goal**: Improve the layout, readability, and user experience while preserving ALL existing Supabase functionality.

This page already works and is connected to Supabase. Your task is to make it beautiful and easier to use WITHOUT changing any backend logic or losing any features.

**Key principle**: Keep it simple. We're redesigning what exists, not adding complex new features.

## CURRENT FUNCTIONALITY (must be preserved):

All Supabase functionality already works. DO NOT break it:

- ✅ Fetching user data (guests, recipes, counts, progress)
- ✅ Creating new guests via "Add Guests and Recipes" button
- ✅ Generating and copying the Recipe Collector form link (this already exists in DB)
- ✅ Deleting guests
- ✅ Filtering between **Pending** (haven't submitted) and **Received** (submitted recipes)
- ✅ Searching guests by name
- ✅ Updating guest status when recipes are submitted

**IMPORTANT**: All buttons, hooks, and Supabase queries exist. Don't change the backend logic or schema - only improve the UI/UX.

## DESIGN REQUIREMENTS:

Reference the screenshot at `/docs/reference/profile_page_redesign` for the target design inspiration.

### Layout Structure:

1. **Header**
   - Left: "Small Plates & Co." logo public/images/logo.svg
   - Right: Notification bell icon + Profile dropdown menu (logout/settings)

2. **Hero Section**
   - Title: "Guest List"
   - Subtitle: "Your Cookbook is Cooking..."
   - Progress bar (dynamic, connected to Supabase recipe counts)

3. **Stats Cards** (3 cards in a row)
   - **Guests**: Total number of invited guests
   - **Recipes Received**: Number of recipes submitted
   - **Guests Pending**: Guests who haven't submitted yet

   All dynamically calculated from Supabase data.

4. **Recipe Collector Card**
   - Title: "Recipe Collector"
   - Subtitle: "Share with guests to collect their favorite recipes."
   - Input field showing the collection URL (from user's `collection_link_token` in Supabase)
   - "Copy Form Link" button (already functional)

5. **Guest Table Section**
   - **Two tabs**: "Pending" (default) | "Received"
   - **Search bar**: Live filter by guest name
   - **"Add Guests and Recipes" button**: Opens existing modal
   - **Table columns**:
     - Checkbox (for future bulk actions)
     - Name
     - Email & Phone (show "No mobile" if empty)
     - Recipe Status (e.g., "Pending" or "2 Recipes Received")
     - Actions: Delete button (🗑️)

### Visual Design:

- **Style**: Minimal, elegant, premium
- **Background**: White with light gray (#f7f7f7) hover states
- **Spacing**: Generous white space, clean layout
- **Typography**: Refined sans-serif (Inter, DM Sans, or similar)
- **Borders**: Light neutral gray (#e5e5e5)
- **Buttons**:
  - Primary: Dark green (#004C46)
  - Secondary: White/gray
- **Hover effects**: Subtle gray backgrounds
- **Rounded corners**: Modern, soft edges

## EXAMPLES:

Study the image: docs/reference/profile_page_redesign.png

Study these existing components - they already work perfectly with Supabase. Your job is to make them look better.

### Current Components (keep all functionality):

**Location**: `components/profile/guests/`

- **`GuestTable.tsx`** (lines 1-313)
  - Data fetching with useEffect (lines 57-114)
  - Modal state management (lines 42-47, 116-141)
  - Refresh patterns (lines 49-50, 143-145)
  - **REUSE THIS LOGIC** - just improve the styling

- **`GuestTableControls.tsx`** (lines 1-77)
  - Search input (lines 33-41)
  - Toggle buttons for Pending/Received filter (lines 19-25, 44-63)
  - **KEEP THIS** - just make it prettier

- **`AddGuestModal.tsx`** (lines 1-349)
  - Multi-tab modal with form (lines 150-158)
  - Already handles guest creation
  - **DON'T TOUCH THE LOGIC** - this works perfectly

- **`GuestDetailsModal.tsx`** (lines 1-478)
  - 3 tabs: Guest Info, Contact Info, Recipe Status
  - **ALREADY COMPLETE** - can be reused as-is

- **`GuestStatistics.tsx`** (lines 1-96)
  - Shows guest/recipe counts
  - **THIS IS YOUR STATS CARDS** - just restyle them

**Location**: `app/profile/page.tsx` (lines 1-185)

This is the main profile page. It already has:
- Header (lines 93-129)
- Centered layout (lines 141-161)
- Component composition
- Progress tracking (lines 43-62)

**Your task**: Reorganize this page to match the new design layout while keeping all functionality.

### Supabase Integration Patterns:

**Location**: `lib/supabase/guests.ts`

All guest operations already work:
```typescript
import { createSupabaseClient } from '@/lib/supabase/client';

// Get guests
await getGuests(includeArchived);

// Add guest
await addGuest(formData);

// Delete guest
await deleteGuest(guestId);

// Search guests
await searchGuests(filters);

// Get statistics
await getGuestStatistics();
```

**IMPORTANT**: These functions already exist and work. Just use them in your redesigned components.

**Location**: `lib/supabase/profiles.ts`

The collection link token is already in the database:
```typescript
// User profile has: collection_link_token
// Use this to generate the shareable recipe collection URL
```

### Database Schema (already exists):

**Location**: `supabase/migrations/20241009_create_tables.sql`

Key tables you'll use:
- `profiles` - has `collection_link_token` for the Recipe Collector link
- `guests` - has `status` field ('pending', 'submitted', 'reached_out')
- `guest_recipes` - tracks submitted recipes

**DON'T create new migrations** - everything you need exists.

## DOCUMENTATION:

### Framework & Styling
- Next.js App Router: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide React Icons: https://lucide.dev/icons/

### UI Components (already in use)
- Radix UI Primitives (Dialog, Tabs): https://www.radix-ui.com/primitives
- TanStack Table: https://tanstack.com/table/latest/docs/introduction

### Supabase (already integrated)
- Client library: https://supabase.com/docs/reference/javascript/introduction
- Database queries: https://supabase.com/docs/reference/javascript/select

## OTHER CONSIDERATIONS:

### What NOT to Do:

❌ **DO NOT** change Supabase functions or database schema
❌ **DO NOT** add new features (email automation, SMS, analytics, etc.)
❌ **DO NOT** create complex new components
❌ **DO NOT** add communication tracking beyond simple Pending/Received
❌ **DO NOT** break existing functionality

### What TO Do:

✅ **Restyle existing components** to match the new design
✅ **Reorganize the layout** of `app/profile/page.tsx`
✅ **Keep all current functionality** working exactly as it does now
✅ **Use existing Supabase functions** - they already work
✅ **Follow the design screenshot** for visual reference

### Key Patterns to Follow:

1. **Supabase client pattern** (already in use everywhere):
   ```typescript
   import { createSupabaseClient } from '@/lib/supabase/client';
   const supabase = createSupabaseClient();
   ```

2. **Component file structure** (already established):
   - Keep components in `components/profile/guests/`
   - Keep page in `app/profile/page.tsx`
   - Don't create new directories unless absolutely necessary

3. **Styling consistency**:
   - Use Tailwind classes matching your design (gray-50, gray-900, etc.)
   - Follow button styles from existing components
   - Match spacing patterns already in use

### Recipe Collector Link:

The collection link is generated from `collection_link_token` in the profiles table. Example:
```typescript
const collectionUrl = `${window.location.origin}/collect/${user.collection_link_token}`;
```

This already exists - you just need to display it nicely and add a copy button.

### Files You'll Modify:

```
app/profile/page.tsx                    (Reorganize layout to match design)
components/profile/guests/
  ├── GuestTable.tsx                    (Update styling)
  ├── GuestTableControls.tsx            (Update styling)
  ├── GuestStatistics.tsx               (Restyle as 3 stat cards)
```

You might create:
```
components/profile/
  └── RecipeCollectorCard.tsx          (New card for collection link + copy button)
```

### Project Structure Reference:

```
/app
  /profile
    page.tsx                   ← Main file to reorganize
/components
  /profile
    /guests
      GuestTable.tsx           ← Restyle this
      GuestTableControls.tsx   ← Restyle this
      GuestStatistics.tsx      ← Turn into 3 cards
      AddGuestModal.tsx        ← Keep as-is
      GuestDetailsModal.tsx    ← Keep as-is
/lib
  /supabase
    guests.ts                  ← All functions already work
    profiles.ts                ← Has collection_link_token
/docs
  /reference                   ← Your design screenshot here
```

### Performance:

- Use `next/image` for logos if needed
- Keep existing table optimization (already uses TanStack Table)
- Maintain current loading states

### Accessibility:

- Keep existing aria-labels
- Maintain keyboard navigation
- Ensure color contrast meets standards

### Success Criteria:

✅ Layout matches the design screenshot
✅ All existing features still work (add, delete, search, filter)
✅ Recipe Collector link displays and copies correctly
✅ Stats cards show correct Supabase data
✅ Progress bar updates dynamically
✅ Table filters between Pending/Received
✅ Search works as before
✅ Design is clean, minimal, and elegant
✅ Responsive on mobile/tablet/desktop
✅ **NO functionality is lost**