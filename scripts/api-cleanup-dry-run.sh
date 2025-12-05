#!/bin/bash

# API Cleanup Dry Run Script
# Shows what would be changed without making any modifications

PROJECT_ROOT="/Users/macbook/Desktop/smallplates_landing"
cd "$PROJECT_ROOT"

echo "🔍 API Cleanup Dry Run Analysis"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_section() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "-----------------------------------------------"
}

print_item() {
    echo -e "  ${GREEN}•${NC} $1"
}

print_warning() {
    echo -e "  ${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "  ${RED}❌${NC} $1"
}

# 1. Show current API structure
print_section "CURRENT API STRUCTURE"
echo "Root level endpoints:"
find app/api -name "route.ts" | grep -v "/v1/" | sort | while read file; do
    endpoint=$(echo "$file" | sed 's|app/api||' | sed 's|/route.ts||')
    print_item "$endpoint"
done

echo -e "\nV1 endpoints:"
find app/api/v1 -name "route.ts" | sort | while read file; do
    endpoint=$(echo "$file" | sed 's|app/api||' | sed 's|/route.ts||')
    print_item "$endpoint"
done

# 2. Show duplicates
print_section "DUPLICATE ENDPOINTS FOUND"
find app/api -name "route.ts" | grep -v "/v1/" | while read file; do
    endpoint=$(echo "$file" | sed 's|/Users/macbook/Desktop/smallplates_landing/app/api||' | sed 's|/route.ts||')
    v1_path="/Users/macbook/Desktop/smallplates_landing/app/api/v1$endpoint"
    if [ -f "$v1_path/route.ts" ]; then
        print_warning "DUPLICATE: $endpoint (has v1 equivalent)"
    fi
done

# 3. Show legacy API calls that need updating
print_section "LEGACY API CALLS TO UPDATE"

echo "Checking OnboardingContext.tsx..."
grep -n "'/api/create-profile'" lib/contexts/OnboardingContext.tsx 2>/dev/null && print_warning "OnboardingContext.tsx uses legacy /api/create-profile" || print_item "OnboardingContext.tsx is clean"

echo -e "\nChecking profile page..."
grep -n "'/api/auth/check-conversion'" app/\(platform\)/profile/page.tsx 2>/dev/null && print_warning "Profile page uses legacy /api/auth/check-conversion" || print_item "Profile page is clean"

echo -e "\nChecking join page..."
grep -n "'/api/invitations/" app/join/\[token\]/page.tsx 2>/dev/null && print_warning "Join page uses legacy invitation endpoints" || print_item "Join page is clean"

echo -e "\nChecking admin operations..."
grep -n "'/api/admin/operations/" app/\(admin\)/admin/operations/page.tsx 2>/dev/null && print_warning "Admin operations uses legacy endpoints" || print_item "Admin operations is clean"

echo -e "\nChecking group components..."
grep -n "'/api/groups/" components/profile/groups/AddFriendToGroupModal.tsx 2>/dev/null && print_warning "Group components use legacy endpoints" || print_item "Group components are clean"

# 4. Show what files would be modified
print_section "FILES THAT WOULD BE MODIFIED"
FILES_TO_UPDATE=(
    "lib/contexts/OnboardingContext.tsx"
    "app/(platform)/profile/page.tsx"
    "app/join/[token]/page.tsx"
    "app/api/v1/invitation/accept/page.tsx"
    "components/profile/groups/AddFriendToGroupModal.tsx"
    "app/(admin)/admin/operations/page.tsx"
    "app/(admin)/admin/operations/components/RecipeOperationsTable.tsx"
)

for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        print_item "$file"
    else
        print_error "$file (not found)"
    fi
done

# 5. Show what directories would be removed
print_section "DIRECTORIES THAT WOULD BE REMOVED"
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

for endpoint in "${DUPLICATES[@]}"; do
    if [ -d "$endpoint" ]; then
        print_warning "$endpoint (exists, will be removed)"
    else
        print_item "$endpoint (already removed)"
    fi
done

# 6. Final summary
print_section "SUMMARY"
TOTAL_DUPLICATES=$(find app/api -name "route.ts" | grep -v "/v1/" | while read file; do
    endpoint=$(echo "$file" | sed 's|/Users/macbook/Desktop/smallplates_landing/app/api||' | sed 's|/route.ts||')
    v1_path="/Users/macbook/Desktop/smallplates_landing/app/api/v1$endpoint"
    [ -f "$v1_path/route.ts" ] && echo "1"
done | wc -l | tr -d ' ')

LEGACY_CALLS=$(grep -r "fetch.*['\"\`]/api/[^v]" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Statistics:"
print_item "Duplicate endpoints to remove: $TOTAL_DUPLICATES"
print_item "Legacy API calls to update: $LEGACY_CALLS"
print_item "Files to modify: ${#FILES_TO_UPDATE[@]}"

echo -e "\n${GREEN}✅ This analysis shows what would change.${NC}"
echo -e "${BLUE}🚀 To perform the actual cleanup, run:${NC}"
echo -e "   ${YELLOW}./scripts/api-cleanup.sh${NC}"
echo ""