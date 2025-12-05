#!/bin/bash

# API Cleanup Script
# Safely removes duplicate API endpoints and updates legacy references

set -e  # Exit on any error

PROJECT_ROOT="/Users/macbook/Desktop/smallplates_landing"
cd "$PROJECT_ROOT"

echo "🧹 Starting API Cleanup..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}🔵 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Phase 1: Update legacy API calls
print_step "PHASE 1: Updating legacy API calls to use v1 endpoints"
echo ""

# Update OnboardingContext.tsx
print_step "Updating OnboardingContext.tsx..."
sed -i '' "s|'/api/create-profile'|'/api/v1/create-profile'|g" lib/contexts/OnboardingContext.tsx
print_success "Updated OnboardingContext.tsx"

# Update profile page auth check
print_step "Updating profile page auth check..."
sed -i '' "s|'/api/auth/check-conversion'|'/api/v1/auth/check-conversion'|g" app/\(platform\)/profile/page.tsx
print_success "Updated profile page"

# Update join page invitation endpoints
print_step "Updating join page invitation endpoints..."
sed -i '' "s|'/api/invitations/verify/|'/api/v1/invitations/verify/|g" app/join/\[token\]/page.tsx
sed -i '' "s|'/api/invitations/mark-visited'|'/api/v1/invitations/mark-visited'|g" app/join/\[token\]/page.tsx
sed -i '' "s|'/api/invitations/consume'|'/api/v1/invitations/consume'|g" app/join/\[token\]/page.tsx
sed -i '' "s|\`/api/invitations/verify/|\`/api/v1/invitations/verify/|g" app/join/\[token\]/page.tsx
print_success "Updated join page"

# Update auth complete signup in invitation accept page
print_step "Updating invitation accept page..."
sed -i '' "s|'/api/auth/complete-signup'|'/api/v1/auth/complete-signup'|g" app/api/v1/invitation/accept/page.tsx
print_success "Updated invitation accept page"

# Update group invitations
print_step "Updating group invitation endpoints..."
sed -i '' "s|'/api/groups/|'/api/v1/groups/|g" components/profile/groups/AddFriendToGroupModal.tsx
sed -i '' "s|\`/api/groups/|\`/api/v1/groups/|g" components/profile/groups/AddFriendToGroupModal.tsx
print_success "Updated group invitations"

# Update admin operations (these should already be v1 but let's check)
print_step "Updating admin operations endpoints..."
sed -i '' "s|'/api/admin/operations/|'/api/v1/admin/operations/|g" app/\(admin\)/admin/operations/page.tsx
sed -i '' "s|'/api/admin/operations/|'/api/v1/admin/operations/|g" app/\(admin\)/admin/operations/components/RecipeOperationsTable.tsx
sed -i '' "s|\`/api/admin/operations/|\`/api/v1/admin/operations/|g" app/\(admin\)/admin/operations/page.tsx
sed -i '' "s|\`/api/admin/operations/|\`/api/v1/admin/operations/|g" app/\(admin\)/admin/operations/components/RecipeOperationsTable.tsx
print_success "Updated admin operations"

echo ""
print_success "PHASE 1 COMPLETED: All legacy API calls updated to v1"
echo ""

# Phase 2: Verify no remaining legacy calls
print_step "PHASE 2: Verifying no legacy API calls remain"
echo ""

# Search for remaining legacy API calls
echo "Searching for remaining legacy API calls..."
LEGACY_CALLS=$(grep -r "fetch.*['\"\`]/api/[^v]" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || true)

if [ -n "$LEGACY_CALLS" ]; then
    print_warning "Found remaining legacy API calls:"
    echo "$LEGACY_CALLS"
    echo ""
    print_warning "Please review these manually before proceeding to Phase 3"
    echo ""
    read -p "Continue with duplicate removal? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Cleanup cancelled by user"
        exit 1
    fi
else
    print_success "No legacy API calls found"
fi

echo ""

# Phase 3: Remove duplicate API endpoints
print_step "PHASE 3: Removing duplicate API endpoints"
echo ""

# List of confirmed duplicates to remove
DUPLICATES=(
    "app/api/collection"
    "app/api/auth/check-conversion"
    "app/api/auth/complete-signup"
    "app/api/auth/callback"
    "app/api/admin/invite-user"
    "app/api/groups"
    "app/api/create-profile"
    "app/api/invitations/consume"
)

# Create backup directory
BACKUP_DIR="api-cleanup-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
print_step "Created backup directory: $BACKUP_DIR"

# Remove duplicates with backup
for endpoint in "${DUPLICATES[@]}"; do
    if [ -d "$endpoint" ]; then
        print_step "Backing up and removing: $endpoint"
        cp -r "$endpoint" "$BACKUP_DIR/"
        rm -rf "$endpoint"
        print_success "Removed: $endpoint"
    else
        print_warning "Not found: $endpoint (already removed?)"
    fi
done

# Remove /app/api/route.ts if it exists (redirect handler)
if [ -f "app/api/route.ts" ]; then
    print_step "Backing up and removing redirect handler: app/api/route.ts"
    cp "app/api/route.ts" "$BACKUP_DIR/"
    rm "app/api/route.ts"
    print_success "Removed redirect handler"
fi

echo ""
print_success "PHASE 3 COMPLETED: Duplicate API endpoints removed"
echo ""

# Phase 4: Cleanup empty directories
print_step "PHASE 4: Cleaning up empty directories"
echo ""

# Remove empty directories in /app/api/ (but keep v1)
find app/api -type d -empty | grep -v "/v1" | while read dir; do
    if [ -d "$dir" ]; then
        rmdir "$dir" 2>/dev/null || true
        print_success "Removed empty directory: $dir"
    fi
done

echo ""

# Final verification
print_step "FINAL VERIFICATION: Checking remaining API structure"
echo ""

echo "Remaining API structure:"
find app/api -type f -name "route.ts" | sort | while read file; do
    endpoint=$(echo "$file" | sed 's|app/api||' | sed 's|/route.ts||')
    if [[ "$file" == *"/v1/"* ]]; then
        echo "✅ $endpoint"
    else
        echo "⚠️  $endpoint (non-v1)"
    fi
done

echo ""
echo "==============================================="
print_success "🎉 API CLEANUP COMPLETED!"
echo ""
print_step "Summary:"
echo "• Updated all legacy API calls to use v1 endpoints"
echo "• Removed duplicate API endpoints"
echo "• Created backup in: $BACKUP_DIR"
echo "• Cleaned up empty directories"
echo ""
print_step "Next steps:"
echo "1. Test the application thoroughly"
echo "2. Run your test suite: npm test"
echo "3. If everything works, you can delete: $BACKUP_DIR"
echo "4. Commit the changes to git"
echo ""
print_warning "If anything breaks, restore from backup:"
echo "cp -r $BACKUP_DIR/* app/api/"
echo ""