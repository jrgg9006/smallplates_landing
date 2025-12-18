# Couple Image Feature - Testing Guide

## Feature Overview
The couple image feature allows users to upload and display couple photos in their recipe collection links.

## Components Updated
1. **Database Migration**: `20251217_add_couple_image_to_groups.sql`
   - Added `couple_image_url` column to `groups` table

2. **Storage Functions**: `lib/supabase/storage.ts`
   - `uploadGroupCoupleImageWithClient()` - Upload couple image to storage
   - `deleteGroupCoupleImage()` - Delete couple image from storage

3. **API Endpoints**: `app/api/v1/groups/[groupId]/couple-image/route.ts`
   - `POST` - Upload/replace couple image
   - `DELETE` - Remove couple image

4. **Collection API**: `lib/supabase/collection.ts`
   - Updated `validateCollectionToken()` to include `couple_image_url`
   - Added to `CollectionTokenInfo` type

5. **ShareCollectionModal**: `components/profile/guests/ShareCollectionModal.tsx`
   - Added image upload UI
   - File validation (5MB limit, image formats only)
   - Preview and manage couple image

6. **CollectionForm**: `app/(public)/collect/[token]/CollectionForm.tsx`
   - **Desktop**: Shows couple image in left column (replaces default image)
   - **Mobile**: Shows couple image above "Personal Note" section

## How to Test

### 1. Upload Couple Image
1. Go to Groups page (`/profile/groups`)
2. Select a group
3. Click "Collection link - Get Plates" button
4. In the ShareCollectionModal, click "Add couple image"
5. Upload an image (JPEG/PNG/WebP, max 5MB)
6. Verify the image appears in the modal preview

### 2. View Collection Form
1. Copy the collection URL from ShareCollectionModal
2. Open URL in new browser/incognito window
3. **Desktop**: Verify couple image appears in left column
4. **Mobile**: Verify couple image appears above "Personal Note"
5. If no image uploaded, default image should show

### 3. Update/Delete Image
1. Return to ShareCollectionModal
2. Click "Add couple image" again
3. Upload a different image to replace
4. Or click "Remove" to delete the image
5. Verify changes reflect in collection form

### 4. Permissions
- Only group owners and admins can upload/delete couple images
- Regular members should not see the "Add couple image" option

## Storage Structure
- Images stored at: `groups/{groupId}/couple_image.{ext}`
- URL saved in `groups.couple_image_url` column
- Previous images automatically deleted when new ones uploaded

## Fallback Behavior
- If no couple image: displays default collection image
- If image fails to load: fallback to default image
- Modal gracefully handles missing groupId

## Known Requirements
- Database migration must be applied in production
- Supabase storage bucket 'recipes' must exist
- Group members with admin/owner role can manage images