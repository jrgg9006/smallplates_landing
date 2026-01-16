# Task: Add Generated Image Upload to Operations Panel

## Context

Small Plates is a wedding cookbook startup. In the admin Operations panel, we track recipe production workflow. Each recipe needs a Midjourney-generated image for the printed book.

**Current flow:**
1. Admin sees recipe in Operations table
2. Clicks recipe → side panel opens with details
3. Copies Midjourney prompt → generates image externally
4. ❌ No way to upload the generated image back

**Desired flow:**
1-3 same as above
4. ✅ Click "Upload Generated Image" → select file → image uploads to Supabase Storage
5. ✅ URL saved to `guest_recipes.generated_image_url`
6. ✅ Checkbox "Image Generated" auto-checks

---

## Database (ALREADY DONE - no action needed)

Column `generated_image_url` already exists in `guest_recipes` table.

---

## Storage Structure

Bucket: `recipes` (already exists, public)

Upload path pattern:
```
recipes/generated/{group_id}/{recipe_id}.{extension}
```

Example:
```
recipes/generated/a1b2c3d4-e5f6-7890-abcd-ef1234567890/x9y8z7w6-v5u4-3210-mnop-qr9876543210.png
```

---

## Files to Modify

### 1. Create API Route: `app/api/v1/admin/operations/recipes/[recipeId]/upload-image/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/config/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { recipeId: string } }
) {
  try {
    // Auth check
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId } = params;

    // Get recipe to find group_id
    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .select('id, group_id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (!recipe.group_id) {
      return NextResponse.json({ error: 'Recipe has no group' }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, or WebP.' }, { status: 400 });
    }

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    
    // Build storage path
    const storagePath = `generated/${recipe.group_id}/${recipeId}.${extension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recipes')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update recipe with the URL
    const { error: updateError } = await supabase
      .from('guest_recipes')
      .update({ generated_image_url: publicUrl })
      .eq('id', recipeId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to save image URL' }, { status: 500 });
    }

    // Also mark image_generated as true in production_status
    const { data: existingStatus } = await supabase
      .from('recipe_production_status')
      .select('id')
      .eq('recipe_id', recipeId)
      .single();

    if (existingStatus) {
      await supabase
        .from('recipe_production_status')
        .update({ image_generated: true, updated_at: new Date().toISOString() })
        .eq('recipe_id', recipeId);
    } else {
      await supabase
        .from('recipe_production_status')
        .insert({
          recipe_id: recipeId,
          image_generated: true,
          text_finalized_in_indesign: false,
          image_placed_in_indesign: false,
        });
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error in upload-image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### 2. Modify: `app/admin/operations/page.tsx`

#### 2a. Add to the RecipeWithProductionStatus interface (around line 20):

Add this field:
```typescript
generated_image_url: string | null;
```

#### 2b. Add state for upload (around line 75, after other useState):

```typescript
const [uploadingImage, setUploadingImage] = useState(false);
```

#### 2c. Add upload handler function (around line 300, after handleDownloadRecipeImages):

```typescript
const handleUploadGeneratedImage = async (recipeId: string, file: File) => {
  setUploadingImage(true);
  
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/v1/admin/operations/recipes/${recipeId}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    const result = await response.json();
    
    // Update local state
    setSelectedRecipe(prev => prev ? {
      ...prev,
      generated_image_url: result.url,
      production_status: {
        ...(prev.production_status || {
          id: '',
          text_finalized_in_indesign: false,
          image_generated: false,
          image_placed_in_indesign: false,
          operations_notes: null,
          production_completed_at: null,
          needs_review: false,
        }),
        image_generated: true,
      }
    } : prev);

    // Refresh data
    handleStatusUpdate();
    
    alert('Image uploaded successfully!');
    
  } catch (error) {
    console.error('Error uploading image:', error);
    alert(error instanceof Error ? error.message : 'Failed to upload image');
  } finally {
    setUploadingImage(false);
  }
};
```

#### 2d. Add Upload UI in the side panel

Find the section after the "Midjourney Prompt" section (around line 750). Add this new section BEFORE the "Ingredients" section:

```tsx
{/* Generated Image Upload Section */}
<div>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-2xl font-semibold text-gray-900">
      Generated Image
    </h3>
  </div>
  <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg shadow-sm">
    {selectedRecipe.generated_image_url ? (
      <div className="space-y-4">
        <div className="relative aspect-square w-64 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={selectedRecipe.generated_image_url}
            alt={`Generated image for ${selectedRecipe.recipe_name}`}
            fill
            className="object-cover"
            sizes="256px"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Image uploaded
          </span>
          <label className="cursor-pointer">
            <span className="text-sm text-blue-600 hover:text-blue-800 underline">
              Replace image
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadGeneratedImage(selectedRecipe.id, file);
                }
                e.target.value = '';
              }}
              disabled={uploadingImage}
            />
          </label>
        </div>
      </div>
    ) : (
      <div className="text-center py-8">
        <div className="mb-4">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 mb-4">No generated image yet</p>
        <label className="cursor-pointer">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            uploadingImage 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}>
            {uploadingImage ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload Generated Image</span>
              </>
            )}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleUploadGeneratedImage(selectedRecipe.id, file);
              }
              e.target.value = '';
            }}
            disabled={uploadingImage}
          />
        </label>
      </div>
    )}
  </div>
</div>
```

---

### 3. Modify API to include generated_image_url: `app/api/v1/admin/operations/recipes/route.ts`

In the SELECT query, add `generated_image_url` to the fields being fetched from `guest_recipes`.

Find the select statement and add the field:
```typescript
generated_image_url,
```

---

## Testing Checklist

1. [ ] Open `/admin/operations`
2. [ ] Click on a recipe that has a Midjourney prompt
3. [ ] Scroll to new "Generated Image" section
4. [ ] Click "Upload Generated Image"
5. [ ] Select a PNG/JPG file
6. [ ] Verify:
   - [ ] Image appears in the section
   - [ ] "Image Generated" checkbox is auto-checked
   - [ ] Image is stored in `recipes/generated/{group_id}/{recipe_id}.png`
   - [ ] `generated_image_url` is saved in database
7. [ ] Test replacing an existing image

---

## Notes

- Only PNG, JPG, and WebP are allowed
- Images are stored with `upsert: true` so re-uploading replaces the old file
- The checkbox "Image Generated" auto-updates when you upload
- File is named after `recipe_id` to ensure uniqueness and easy retrieval by scripts