# PRP: Share Link Feature Implementation

## Feature Overview
Implement a share modal that allows users to share their Collection Link through multiple platforms (Copy Link, Email, WhatsApp, Facebook), replicating the NYTimes share UX experience.

## Context and Requirements

### Feature Requirements (from INITIAL_SHARE.md)
- **Trigger**: "Copy Form Link" button in Profile page
- **Modal**: Shows 4 platform options (Copy Link, Email, WhatsApp, Facebook)
- **MVP Focus**: WhatsApp implementation first
- **UX Reference**: NYTimes share flow (see /examples/share_feature/ images)
- **Share Content**:
  - Title: "Share a Recipe to my Cookbook - SP&Co."
  - Message: "(user-name) invites you to share your favorite recipe with them! They will print it in a cookbook."
  - Collection Link

### Technology Stack
- **Framework**: Next.js 15.0.0 with React 19.0.0
- **Language**: TypeScript
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase

### Existing Code References

#### 1. Current Share Implementation
**File**: `/components/profile/guests/RecipeCollectorLink.tsx`
- Lines 49-53: Contains TEST code using hardcoded URL - MUST be fixed
- Lines 145-178: Share button with Web Share API and clipboard fallback
- Uses `navigator.share()` for native sharing
- Falls back to clipboard copy

#### 2. Share Utilities
**File**: `/lib/utils/sharing.ts`
```typescript
// Already available utilities:
- isIOSDevice(): boolean
- isMobileDevice(): boolean  
- validateWhatsAppURL(url: string): { isValid: boolean; error?: string }
- getWhatsAppTroubleshootingTips(platform: string): string
- createShareURL(baseUrl: string, params: Record<string, string>): string
```

#### 3. Modal Pattern
**Reference**: `/components/profile/guests/AddGuestModal.tsx`
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Modal structure pattern
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### 4. Button Pattern
**Reference**: `/components/ui/button.tsx`
- Uses CVA for variants
- Standard variants: default, secondary, outline, ghost

## External Documentation

### Web APIs
1. **Web Share API**: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
2. **WhatsApp URL Scheme**: https://faq.whatsapp.com/591452966008682/
3. **Open Graph Protocol**: https://ogp.me/ (for rich link previews)

### Platform Share URLs
```typescript
// WhatsApp
https://wa.me/?text=URL_ENCODED_MESSAGE

// Email
mailto:?subject=SUBJECT&body=BODY

// Facebook
https://www.facebook.com/sharer/sharer.php?u=URL
```

## Implementation Blueprint

### Phase 1: Fix Current Implementation
1. Update RecipeCollectorLink.tsx to use actual collection URL instead of test URL
2. Integrate with getUserCollectionToken() from Supabase

### Phase 2: Create Share Modal Component
```typescript
// File: /components/profile/guests/ShareCollectionModal.tsx

interface ShareOption {
  id: 'copy' | 'email' | 'whatsapp' | 'facebook';
  label: string;
  icon: LucideIcon;
  action: () => void;
}

const ShareCollectionModal = ({ 
  isOpen, 
  onClose, 
  collectionUrl,
  userName 
}: Props) => {
  // Implementation following AddGuestModal pattern
}
```

### Phase 3: Implement Share Options
1. **Copy Link**: Use existing clipboard implementation
2. **WhatsApp**: 
   ```typescript
   const shareViaWhatsApp = () => {
     const message = encodeURIComponent(
       `${userName} invites you to share your favorite recipe with them! They will print it in a cookbook.\n\n${collectionUrl}`
     );
     window.open(`https://wa.me/?text=${message}`, '_blank');
   };
   ```
3. **Email**: Use mailto with subject and body
4. **Facebook**: Use Facebook sharer URL

### Phase 4: Add Open Graph Meta Tags
Update app layout or create dynamic meta tags for rich previews.

## Implementation Tasks (in order)

1. **Fix Current Share URL**
   - Update RecipeCollectorLink.tsx lines 49-53
   - Remove TEST code and use actual collection URL
   - Ensure proper URL construction with domain

2. **Create ShareCollectionModal Component**
   - Create new file following modal pattern
   - Import Dialog components from UI
   - Define share options array
   - Style according to existing modals

3. **Update RecipeCollectorLink Component**
   - Import ShareCollectionModal
   - Replace current share logic with modal trigger
   - Pass collection URL and user name

4. **Implement Platform Share Functions**
   - WhatsApp sharing (MVP priority)
   - Copy link function
   - Email sharing
   - Facebook sharing

5. **Add Loading and Error States**
   - Loading state while fetching user data
   - Error handling for share failures
   - Success feedback (toast/notification)

6. **Mobile Optimization**
   - Test on iOS/Android devices
   - Ensure proper touch targets
   - Verify WhatsApp app launches correctly

## Validation Gates

```bash
# TypeScript compilation
npm run build

# Development server
npm run dev

# Manual testing checklist:
# - [ ] Modal opens when clicking "Copy Form Link"
# - [ ] All 4 share options are visible
# - [ ] WhatsApp opens with pre-filled message
# - [ ] Copy link shows success feedback
# - [ ] Email opens with subject and body
# - [ ] Facebook sharer opens correctly
# - [ ] Modal closes properly
# - [ ] Mobile experience is smooth
```

## Error Handling Strategy

1. **Share API Failures**
   - Fallback to manual share methods
   - Show user-friendly error messages
   - Log errors for debugging

2. **URL Validation**
   - Use validateWhatsAppURL() for WhatsApp shares
   - Ensure URLs are properly encoded
   - Handle special characters in user names

3. **Platform Detection**
   - Use existing utilities (isMobileDevice, isIOSDevice)
   - Provide platform-specific instructions if needed

## Common Pitfalls to Avoid

1. **URL Encoding**: Always encode URLs and messages for share platforms
2. **Mobile Detection**: Use feature detection, not user agent sniffing
3. **Share API Support**: Not all browsers support Web Share API
4. **WhatsApp Limits**: URLs must be under 2048 characters
5. **Test URLs**: Ensure no test/hardcoded URLs remain in production

## Success Metrics

- Share modal matches NYTimes UX reference
- WhatsApp sharing works on iOS and Android
- All share options function correctly
- No regression in existing functionality
- Clean, maintainable code following project patterns

## References

- Feature Requirements: `/INITIAL_SHARE.md`
- UX Examples: `/examples/share_feature/` (1.PNG through 7.PNG, ideal.PNG)
- Current Implementation: `/components/profile/guests/RecipeCollectorLink.tsx`
- Share Utilities: `/lib/utils/sharing.ts`
- Modal Pattern: `/components/profile/guests/AddGuestModal.tsx`

---

**Confidence Score: 9/10**

This PRP provides comprehensive context for implementing the share feature. The only uncertainty is around the exact user data structure for personalizing the share message, but this can be discovered during implementation by examining the Supabase queries.