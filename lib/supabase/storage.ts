import { createSupabaseClient } from './client';

/**
 * Upload recipe documents (images/PDFs) to Supabase storage
 * Returns array of public URLs for the uploaded files
 */
export async function uploadRecipeDocuments(
  guestId: string,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> {
  const supabase = createSupabaseClient();
  const uploadedUrls: string[] = [];

  try {
    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${guestId}/${timestamp}_${i}.${fileExt}`;
      const filePath = `recipe-documents/${fileName}`;

      console.log(`Uploading file ${i + 1}/${files.length}: ${file.name} to path: ${filePath}`);

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('recipes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`Error uploading file ${file.name}:`, {
          error: uploadError,
          filePath: filePath,
          fileSize: file.size,
          fileType: file.type
        });
        // Continue with other files even if one fails
        continue;
      }

      console.log(`Successfully uploaded file: ${file.name}`, { data });

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('recipes')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length === 0) {
      return { urls: [], error: 'Failed to upload any files' };
    }

    return { urls: uploadedUrls, error: null };
  } catch (error) {
    console.error('Error in uploadRecipeDocuments:', error);
    return { urls: [], error: 'An unexpected error occurred while uploading files' };
  }
}

/**
 * Delete recipe documents from storage
 * Used when cleaning up failed submissions
 */
export async function deleteRecipeDocuments(urls: string[]): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    // Extract file paths from URLs
    const filePaths = urls.map(url => {
      // Extract path after '/storage/v1/object/public/recipes/'
      const match = url.match(/\/storage\/v1\/object\/public\/recipes\/(.+)$/);
      return match ? match[1] : null;
    }).filter(Boolean) as string[];

    if (filePaths.length > 0) {
      const { error } = await supabase.storage
        .from('recipes')
        .remove(filePaths);

      if (error) {
        console.error('Error deleting files:', error);
      }
    }
  } catch (error) {
    console.error('Error in deleteRecipeDocuments:', error);
  }
}