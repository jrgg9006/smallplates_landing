# App Folder Reorganization - Phase 2 Migration Notes

## Date: November 28, 2024

### Overview
Completed Phase 2 of the app folder reorganization, focusing on consolidating similar features and removing duplicates.

### Changes Made

#### 1. Consolidated Invitations
Moved all invitation-related routes to the `(auth)` route group for better organization:
- `/invitations/*` → `/(auth)/invitations/*`
  - Platform invitations (both accept and join flows)
  - Group invitations

#### 2. Moved Groups to Platform
- `/groups/*` → `/(platform)/groups/*`
  - Groups functionality is now properly within the authenticated platform area

#### 3. Moved Collect to Public
- `/collect/*` → `/(public)/collect/*`
  - Guest recipe collection doesn't require authentication, so it belongs in public

#### 4. Cleaned Up Legacy/Duplicate Routes
- Removed empty `/invitation/` directory (leftover from previous migration)
- Removed empty `/join/` directory (leftover from previous migration)
- Removed original `/app/page.tsx` (now using `/(public)/page.tsx`)

### Current App Structure

```
/app
├── (admin)/
│   └── admin/
│       ├── activity/
│       ├── invitations/
│       ├── operations/
│       ├── users/
│       └── waitlist/
│
├── (auth)/
│   ├── invitations/        # NEW: Consolidated all invitations here
│   │   ├── group/
│   │   └── platform/
│   ├── onboarding/
│   └── reset-password/
│
├── (platform)/
│   ├── groups/            # NEW: Moved from root
│   └── profile/
│       ├── account/
│       ├── cookbook/
│       ├── groups/
│       ├── orders/
│       └── recipes/
│
├── (public)/
│   ├── about/
│   ├── collect/          # NEW: Moved from root
│   ├── how-it-works/
│   ├── page.tsx         # Landing page
│   └── preview-recipe-journey/
│
├── api/                  # Not yet reorganized (Phase 3)
├── globals.css
└── layout.tsx
```

### Benefits Achieved
1. **Clearer Organization**: All invitations in one place under `(auth)`
2. **Logical Grouping**: Groups functionality properly in authenticated area
3. **No More Duplicates**: Removed legacy/duplicate routes
4. **Better Feature Boundaries**: Each route group contains related features

### Important Notes
1. **URLs Unchanged**: Route groups don't affect URLs, so all links continue to work
2. **API Routes**: Still to be reorganized in Phase 3
3. **No Breaking Changes**: All functionality remains accessible at the same URLs

### Testing Checklist
- [ ] Invitation flows (platform and group) work correctly
- [ ] Groups pages accessible when authenticated
- [ ] Guest collection forms still accessible publicly
- [ ] No 404 errors or broken links
- [ ] Admin panel still functional

### Next Steps (Phase 3)
1. Create versioned API structure (`/api/v1/`)
2. Reorganize API routes for consistency
3. Implement proper API route grouping
4. Add API documentation

### Rollback Instructions
If issues arise:
1. Move folders back from route groups to `/app` root
2. Restore original `/app/page.tsx` if needed
3. Recreate any removed directories