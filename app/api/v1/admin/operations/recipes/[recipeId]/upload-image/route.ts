import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    await requireAdminAuth();

    const { recipeId } = await params;
    const { extension, contentType } = await request.json();

    // SECURITY: Validate recipeId format (should be UUID)
    if (!recipeId || typeof recipeId !== 'string' || recipeId.length < 20) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // SECURITY: Validate extension - only allow safe file extensions
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];
    const normalizedExtension = extension?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalizedExtension || !allowedExtensions.includes(normalizedExtension)) {
      return NextResponse.json({ error: 'Invalid file extension. Use PNG, JPG, or WebP.' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, or WebP.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Get recipe to find group_id and current image URL
    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .select('id, group_id, generated_image_url')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // SECURITY: Validate group_id format if present (should be UUID)
    if (recipe.group_id && (typeof recipe.group_id !== 'string' || recipe.group_id.length < 20)) {
      return NextResponse.json({ error: 'Invalid group ID format' }, { status: 400 });
    }

    // Determine storage path - use group_id if available, otherwise use archived folder
    // SECURITY: Path is constructed from validated recipeId and group_id only
    const storagePath = recipe.group_id 
      ? `generated/${recipe.group_id}/${recipeId}.${normalizedExtension}`
      : `generated/archived/${recipeId}.${normalizedExtension}`;

    // SECURITY: Validate and construct expected paths for this specific recipe
    // This ensures we ONLY delete images that belong to THIS recipe
    const expectedPaths: string[] = [];
    
    // Build expected paths for all possible extensions
    // SECURITY: Only use validated extensions and validated recipeId/group_id
    const extensions = ['png', 'jpg', 'jpeg', 'webp'];
    extensions.forEach(ext => {
      if (recipe.group_id) {
        expectedPaths.push(`generated/${recipe.group_id}/${recipeId}.${ext}`);
      } else {
        expectedPaths.push(`generated/archived/${recipeId}.${ext}`);
      }
    });

    // Delete existing image if it exists - WITH STRICT VALIDATION
    if (recipe.generated_image_url) {
      try {
        // Extract path from URL
        const urlMatch = recipe.generated_image_url.match(/\/storage\/v1\/object\/public\/recipes\/(.+)$/);
        if (urlMatch) {
          const existingPath = urlMatch[1];
          
          // CRITICAL SECURITY CHECK: Only delete if the path matches one of our expected paths
          // This prevents path traversal attacks and ensures we never delete images from other recipes/groups
          const isPathValid = expectedPaths.some(expectedPath => {
            // Exact match or normalized comparison
            return existingPath === expectedPath || 
                   existingPath.replace(/\/+/g, '/') === expectedPath.replace(/\/+/g, '/');
          });
          
          // Additional security: Validate path format to prevent path traversal
          // Path must start with 'generated/' and contain the recipeId
          const isValidFormat = existingPath.startsWith('generated/') && 
                                existingPath.includes(recipeId) &&
                                !existingPath.includes('..') && // No path traversal
                                !existingPath.includes('//'); // No double slashes
          
          if (isPathValid && isValidFormat) {
            // CRITICAL SECURITY: Use strict regex to verify path structure
            // Path must match exactly: generated/{group_id or archived}/{recipeId}.{ext}
            const pathPattern = recipe.group_id
              ? new RegExp(`^generated/${recipe.group_id.replace(/[^a-zA-Z0-9-]/g, '')}/${recipeId.replace(/[^a-zA-Z0-9-]/g, '')}\\.(png|jpg|jpeg|webp)$`)
              : new RegExp(`^generated/archived/${recipeId.replace(/[^a-zA-Z0-9-]/g, '')}\\.(png|jpg|jpeg|webp)$`);
            
            if (pathPattern.test(existingPath)) {
              // Safe to delete - path structure matches exactly for this recipe
              await supabase.storage
                .from('recipes')
                .remove([existingPath]);
            } else {
              console.warn(`Security: Rejected deletion of path ${existingPath} - regex validation failed for recipe ${recipeId}`);
            }
          } else {
            console.warn(`Security: Rejected deletion of path ${existingPath} - path validation failed`);
          }
        }
      } catch (error) {
        // Log but don't fail - the new upload will overwrite anyway
        console.log('Note: Could not delete existing image (may not exist):', error);
      }
    }

    // Delete any existing images with different extensions at the expected location
    // Only delete paths that we constructed ourselves (expectedPaths)
    // Filter out the extension we're about to upload
    const pathsToDelete = expectedPaths.filter(path => {
      const pathExt = path.split('.').pop()?.toLowerCase();
      return pathExt !== normalizedExtension.toLowerCase();
    });
    
    if (pathsToDelete.length > 0) {
      // CRITICAL SECURITY: Final validation using strict regex for each path
      const pathPattern = recipe.group_id
        ? new RegExp(`^generated/${recipe.group_id.replace(/[^a-zA-Z0-9-]/g, '')}/${recipeId.replace(/[^a-zA-Z0-9-]/g, '')}\\.(png|jpg|jpeg|webp)$`)
        : new RegExp(`^generated/archived/${recipeId.replace(/[^a-zA-Z0-9-]/g, '')}\\.(png|jpg|jpeg|webp)$`);
      
      const allPathsValid = pathsToDelete.every(path => {
        return pathPattern.test(path);
      });
      
      if (allPathsValid) {
        // All paths validated - safe to delete
        await supabase.storage
          .from('recipes')
          .remove(pathsToDelete);
      } else {
        console.error('Security: Aborted deletion - regex validation failed for some paths');
      }
    }

    // Generate signed upload URL (bypasses RLS, valid for 2 minutes)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('recipes')
      .createSignedUploadUrl(storagePath);

    if (signedError) {
      console.error('Signed URL error:', signedError);
      return NextResponse.json({ error: 'Failed to create upload URL: ' + signedError.message }, { status: 500 });
    }

    // Get the public URL for after upload
    const { data: urlData } = supabase.storage
      .from('recipes')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      publicUrl: urlData.publicUrl,
      storagePath,
    });

  } catch (error) {
    console.error('Error in upload-image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
