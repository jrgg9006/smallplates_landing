-- Add storage RLS policy for couple image uploads (Alternative approach)
-- Date: 2025-12-17
-- Description: Allow group members to upload, update, and delete couple images

-- Create policy for group members to INSERT couple images
CREATE POLICY "Group members can upload couple images" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'recipes' 
  AND (storage.foldername(name))[1] = 'groups'
  AND auth.uid() IN (
    SELECT profile_id::uuid 
    FROM public.group_members 
    WHERE group_id = ((storage.foldername(name))[2])::uuid
  )
);

-- Create policy for group members to UPDATE couple images
CREATE POLICY "Group members can update couple images" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'recipes' 
  AND (storage.foldername(name))[1] = 'groups'
  AND auth.uid() IN (
    SELECT profile_id::uuid 
    FROM public.group_members 
    WHERE group_id = ((storage.foldername(name))[2])::uuid
  )
);

-- Create policy for group members to DELETE couple images  
CREATE POLICY "Group members can delete couple images" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'recipes' 
  AND (storage.foldername(name))[1] = 'groups'
  AND auth.uid() IN (
    SELECT profile_id::uuid 
    FROM public.group_members 
    WHERE group_id = ((storage.foldername(name))[2])::uuid
  )
);

-- Create policy for group members to SELECT/view couple images
CREATE POLICY "Group members can view couple images" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'recipes' 
  AND (storage.foldername(name))[1] = 'groups'
  AND auth.uid() IN (
    SELECT profile_id::uuid 
    FROM public.group_members 
    WHERE group_id = ((storage.foldername(name))[2])::uuid
  )
);

-- Also allow public read access for couple images (for guests viewing the collection form)
CREATE POLICY "Public can view couple images" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'recipes' 
  AND (storage.foldername(name))[1] = 'groups'
  AND name LIKE '%couple_image%'
);