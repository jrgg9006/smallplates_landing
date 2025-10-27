# User Profile Page Redesign PRP

## Goal
Redesign the **User Profile Page (Guest List)** to improve layout, readability, and user experience while preserving ALL existing Supabase functionality. Transform the current working page into a beautiful, modern, and intuitive interface that matches the provided design mockup.

## Why
- **User Experience**: Current layout needs better visual hierarchy and modern styling
- **User Engagement**: Clean, professional interface encourages continued usage
- **Brand Consistency**: Align with premium, minimal design aesthetic
- **Functionality Preservation**: Keep all existing features working without disruption

## What
Transform the profile page layout to match the design screenshot with:
1. **Header**: Logo + notification bell + profile dropdown
2. **Hero Section**: "Guest List" title, subtitle "Your Cookbook is Cooking...", progress bar
3. **Stats Cards**: 3 cards showing Guests, Recipes Received, Guests Pending
4. **Recipe Collector Card**: URL display with copy button
5. **Guest Table Section**: Tabs (Pending/Received), search, table with modern styling

### Success Criteria
- [ ] Layout matches design screenshot exactly
- [ ] All existing Supabase functionality preserved (add, delete, search, filter)
- [ ] Recipe Collector link displays and copies correctly
- [ ] Stats cards show real-time Supabase data
- [ ] Progress bar updates dynamically
- [ ] Table filters between Pending/Received properly
- [ ] Search functionality works as before
- [ ] Responsive design works on all screen sizes
- [ ] **NO functionality is lost**

## All Needed Context

### Documentation & References
```yaml
# Design Reference
- file: /docs/reference/profile_page_redesign.png
  why: Visual target for layout, spacing, colors, component arrangement

# Framework Documentation  
- url: https://nextjs.org/docs/app/building-your-application/routing
  why: App Router patterns used throughout codebase

- url: https://tailwindcss.com/docs/responsive-design
  why: Responsive design patterns for mobile/tablet/desktop

- url: https://lucide.dev/icons/
  why: Icon library already in use (Bell, Search, etc.)

# UI Component Library
- url: https://www.radix-ui.com/primitives/docs/components/tabs
  why: Tabs component for Pending/Received filtering

- url: https://ui.shadcn.com/docs/components/card
  why: Card component patterns for stats cards

# Supabase Integration
- url: https://supabase.com/docs/reference/javascript/select
  why: Database query patterns already implemented

# Current Implementation Files
- file: app/profile/page.tsx (lines 1-185)
  why: Main page structure to reorganize, existing component composition

- file: components/profile/guests/GuestTable.tsx (lines 1-313)
  why: Data fetching patterns, modal management, keep all logic

- file: components/profile/guests/GuestStatistics.tsx (lines 1-96)
  why: Stats calculation, transform into 3 separate cards

- file: components/profile/guests/GuestTableControls.tsx (lines 1-77)
  why: Search and filter patterns, enhance with proper tabs

- file: components/profile/guests/RecipeCollectorLink.tsx (lines 1-147)
  why: Collection link logic, needs restyling to match design

- file: lib/supabase/guests.ts
  why: All guest operations (getGuests, addGuest, deleteGuest, searchGuests, getGuestStatistics)

- file: lib/supabase/profiles.ts  
  why: Collection token management for Recipe Collector
```

### Current Codebase Structure
```bash
app/
  profile/
    page.tsx                    # Main page - needs layout reorganization
components/
  profile/
    ProfileDropdown.tsx         # Header component - keep as-is
    ProgressBar.tsx            # Progress component - keep as-is  
    guests/
      GuestTable.tsx           # Table logic - keep functionality, update styling
      GuestTableControls.tsx   # Search/filters - enhance with proper tabs
      GuestStatistics.tsx      # Stats display - convert to 3 cards
      RecipeCollectorLink.tsx  # Collection link - restyle to match design
      AddGuestModal.tsx        # Modal - keep as-is
      GuestDetailsModal.tsx    # Modal - keep as-is
lib/
  supabase/
    guests.ts                  # All guest CRUD operations - don't modify
    profiles.ts                # Profile/token operations - don't modify
    collection.ts              # Collection token functions - don't modify
```

### Desired Codebase Structure (Minimal Changes)
```bash
# Same structure - only modify existing files, potentially add:
components/
  profile/
    RecipeCollectorCard.tsx    # New OR modify existing RecipeCollectorLink.tsx
```

### Known Gotchas & Critical Patterns
```typescript
// CRITICAL: Supabase client pattern used everywhere
import { createSupabaseClient } from '@/lib/supabase/client';
const supabase = createSupabaseClient();

// CRITICAL: Collection URL generation pattern
const collectionUrl = `${window.location.origin}/collect/${token}`;

// CRITICAL: Existing refresh trigger pattern  
const [refreshTrigger, setRefreshTrigger] = useState(0);
// Used in: setRefreshTrigger(prev => prev + 1)

// CRITICAL: TanStack Table integration for GuestTable
// Don't break existing table functionality - keep all sorting, pagination

// CRITICAL: Modal state management patterns
// Keep existing modal patterns for AddGuestModal, GuestDetailsModal

// CRITICAL: Authentication check pattern
const { user, loading } = useAuth();
// Used throughout for user-specific data loading

// CRITICAL: Color scheme from design
// Primary: Dark green (#004C46)  
// Background: White with light gray (#f7f7f7) hover
// Borders: Light gray (#e5e5e5)
// Use existing Tailwind classes matching these colors
```

## Implementation Blueprint

### Layout Structure (Match Design Screenshot)
```typescript
// New layout organization for app/profile/page.tsx
return (
  <div className="min-h-screen bg-white">
    {/* Header - Logo + Bell + Profile */}
    <HeaderSection />
    
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero Section - Title + Subtitle + Progress */}
      <HeroSection />
      
      {/* 3 Stats Cards Row */}
      <StatsCardsSection />
      
      {/* Recipe Collector Card */}
      <RecipeCollectorSection />
      
      {/* Guest Table with Tabs */}
      <GuestTableSection />
    </div>
  </div>
);
```

### Task List (Order of Implementation)

```yaml
Task 1: Modify Header Layout (app/profile/page.tsx)
  PRESERVE: All existing header functionality (logo link, bell, dropdown)
  MODIFY: Layout to match design - logo left, notification+profile right
  KEEP: All click handlers, authentication logic

Task 2: Restructure Main Content Layout (app/profile/page.tsx)  
  REMOVE: Centered layout containers for individual sections
  ADD: Proper hero section with title + subtitle + progress
  PRESERVE: All data loading, state management, modal handling

Task 3: Transform Stats Component (components/profile/guests/GuestStatistics.tsx)
  CHANGE: From 2-column grid to 3-card row layout
  ADD: "Guests Pending" as third card (total_guests - recipes_received)
  PRESERVE: All Supabase data fetching logic
  STYLE: Match card design from screenshot

Task 4: Create/Restyle Recipe Collector Card
  OPTION A: Modify components/profile/guests/RecipeCollectorLink.tsx
  OPTION B: Create new components/profile/RecipeCollectorCard.tsx
  PRESERVE: All token management, copy functionality
  MATCH: Design with URL input field + "Copy Form Link" button
  
Task 5: Enhance Table Controls (components/profile/guests/GuestTableControls.tsx)
  ADD: Proper tabs for "Pending" and "Received" 
  PRESERVE: Existing search functionality
  CONNECT: Tabs to actual filtering (currentlyvisual-only)
  STYLE: Match design tab styling

Task 6: Update Table Styling (components/profile/guests/GuestTable.tsx)
  PRESERVE: All TanStack Table functionality, data fetching, modals
  UPDATE: Table styling to match design
  ENSURE: Responsive design works
  KEEP: All column definitions, sorting, pagination

Task 7: Polish and Testing
  TEST: All existing functionality still works
  VERIFY: Design matches screenshot
  CHECK: Responsive behavior
  VALIDATE: No Supabase integration broken
```

### Per Task Implementation Details

#### Task 1: Header Layout Pseudocode
```tsx
// Modify header section in app/profile/page.tsx (lines 93-129)
<header className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6 py-4">
    <div className="flex items-center justify-between">
      {/* Left side - Logo only */}
      <Link href="/">
        <Image src="/images/logo.svg" alt="Small Plates & Co." width={180} height={32} />
      </Link>
      
      {/* Right side - Bell + Profile */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <ProfileDropdown />
      </div>
    </div>
  </div>
</header>
```

#### Task 2: Hero Section Pseudocode
```tsx
// Add hero section after header
<div className="text-center mb-8">
  <h1 className="text-4xl font-bold text-gray-900 mb-2">Guest List</h1>
  <p className="text-xl text-gray-600 mb-8">Your Cookbook is Cooking...</p>
  <ProgressBar current={progressData?.current_recipes} goal={progressData?.goal_recipes} />
</div>
```

#### Task 3: Stats Cards Pseudocode
```tsx
// Modify GuestStatistics.tsx to show 3 cards in row
const statItems = [
  { label: "Guests", value: stats.total_guests },
  { label: "Recipes Received", value: stats.recipes_received },
  { label: "Guests Pending", value: stats.total_guests - stats.recipes_received }
];

return (
  <div className="grid grid-cols-3 gap-6 mb-8">
    {statItems.map((stat) => (
      <div key={stat.label} className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
        <div className="text-sm text-gray-600">{stat.label}</div>
      </div>
    ))}
  </div>
);
```

#### Task 5: Table Controls with Tabs
```tsx
// Enhance GuestTableControls.tsx with real tabs functionality
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-4">
    {/* Tab buttons */}
    <div className="flex">
      <button 
        onClick={() => onStatusChange('pending')}
        className={activeTab === 'pending' ? 'tab-active' : 'tab-inactive'}
      >
        Pending
      </button>
      <button 
        onClick={() => onStatusChange('received')}  
        className={activeTab === 'received' ? 'tab-active' : 'tab-inactive'}
      >
        Received
      </button>
    </div>
    
    {/* Search */}
    <SearchInput />
  </div>
  
  {/* Add button */}
  <Button onClick={onAddGuest}>Add Guests and Recipes</Button>
</div>
```

### Integration Points
```yaml
STATE_MANAGEMENT:
  - preserve: All existing useState hooks for modals, search, filters
  - enhance: Add tab state management in GuestTableControls
  - connect: Tab state to actual data filtering in GuestTable

STYLING:
  - use: Existing Tailwind classes for consistency
  - add: New color scheme classes (#004C46 for primary buttons)
  - maintain: Existing responsive patterns

DATA_FLOW:
  - preserve: All Supabase data fetching patterns
  - maintain: Refresh triggers and loading states
  - keep: Error handling patterns
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Check component imports and exports
# Expected: No TypeScript errors
```

### Level 2: Functionality Testing
```bash
# Start development server  
npm run dev

# Manual testing checklist:
# 1. Profile page loads without errors
# 2. Header shows logo, bell, profile dropdown
# 3. Hero section displays title, subtitle, progress bar
# 4. Stats cards show real data from Supabase
# 5. Recipe collector card displays URL and copy works
# 6. Tabs switch between Pending/Received
# 7. Search filters table results
# 8. Add Guest modal opens and works
# 9. Table displays guests correctly
# 10. Delete functionality works
# 11. Guest details modal opens
```

### Level 3: Design Validation
```bash
# Compare with design screenshot:
# 1. Layout matches design proportions
# 2. Colors match specified palette
# 3. Typography sizes and weights match
# 4. Spacing and padding match design
# 5. Responsive behavior works on mobile/tablet
```

### Level 4: Data Integration Testing
```bash
# Test all Supabase functionality:
# 1. Guest statistics load correctly
# 2. Guest list loads and displays
# 3. Search filters work
# 4. Status filtering works  
# 5. Add guest creates record in database
# 6. Delete guest removes from database
# 7. Progress bar reflects real recipe counts
# 8. Collection link generates correctly
```

## Final Validation Checklist
- [ ] Layout exactly matches design screenshot
- [ ] All existing Supabase functionality preserved
- [ ] Search and filtering work correctly
- [ ] Stats cards display real-time data
- [ ] Progress bar updates dynamically
- [ ] Recipe collector link works
- [ ] Add/delete guests work
- [ ] Responsive design works
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] All modals open and function correctly

## Anti-Patterns to Avoid
- ❌ Don't modify Supabase function signatures or database queries
- ❌ Don't break existing modal functionality 
- ❌ Don't change component data flow patterns
- ❌ Don't remove existing authentication checks
- ❌ Don't hardcode data that should come from Supabase
- ❌ Don't create new files unless absolutely necessary
- ❌ Don't change existing state management patterns
- ❌ Don't modify existing error handling logic

---

**PRP Confidence Score: 9/10**

This PRP provides comprehensive context with:
- Complete design reference
- Detailed current codebase analysis  
- Specific file locations and line numbers
- Preservation of all existing functionality
- Clear task breakdown with pseudocode
- Thorough validation steps
- Anti-patterns to avoid

The high confidence comes from preserving existing working functionality while only updating UI/UX, following established patterns, and providing exact implementation guidance.