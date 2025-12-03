#!/bin/bash

# Script to update API paths from /api/* to /api/v1/*

echo "Updating API paths to v1..."

# Auth APIs
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/auth/|/api/v1/auth/|g'

# Admin APIs
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/admin/|/api/v1/admin/|g'

# Groups APIs
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/groups/|/api/v1/groups/|g'

# Invitations APIs
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/invitations/|/api/v1/invitations/|g'

# Collection APIs
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/collection/|/api/v1/users/collection/|g'

# Create Profile API
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/create-profile|/api/v1/users/create-profile|g'

# Notify New Recipe API
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/notify-new-recipe|/api/v1/recipes/notify-new-recipe|g'

# Send Invitation API
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/send-invitation|/api/v1/invitations/send-invitation|g'

echo "API paths updated!"