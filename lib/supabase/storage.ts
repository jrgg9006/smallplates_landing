import { createSupabaseClient } from './client';

/**
 * Generate a unique session ID for temporary uploads
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Upload files to temporary staging area during recipe creation (with shared client)
 * Returns session ID and file metadata for later processing
 */
export async function uploadFilesToStagingWithClient(
  supabase: any, // Using any to avoid circular type dependencies
  sessionId: string,
  files: File[]
): Promise<{ sessionId: string; fileMetadata: Array<{originalName: string; tempPath: string; size: number; type: string}>; error: string | null }> {
  const fileMetadata: Array<{originalName: string; tempPath: string; size: number; type: string}> = [];

  try {
    // Upload each file to temp staging area
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      // Extract just the filename from full path and sanitize it
      const baseFileName = file.name.split('/').pop() || file.name;
      const sanitizedOriginalName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const tempFileName = `${String(i + 1).padStart(3, '0')}.${fileExt}`;
      const tempPath = `temp/uploads/${sessionId}/${tempFileName}`;

      console.log(`Uploading file ${i + 1}/${files.length} to staging: ${file.name} → ${tempPath}`);

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('recipes')
        .upload(tempPath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`Error uploading file ${file.name} to staging:`, {
          error: uploadError,
          tempPath: tempPath,
          fileSize: file.size,
          fileType: file.type
        });
        // Cleanup any already uploaded files from this session
        await cleanupStagingFiles(sessionId);
        return { sessionId, fileMetadata: [], error: `Failed to upload ${file.name}: ${uploadError.message}` };
      }

      console.log(`Successfully staged file: ${file.name}`, { data });

      fileMetadata.push({
        originalName: sanitizedOriginalName,
        tempPath: tempPath,
        size: file.size,
        type: file.type
      });
    }

    if (fileMetadata.length === 0) {
      return { sessionId, fileMetadata: [], error: 'No files were uploaded' };
    }

    return { sessionId, fileMetadata, error: null };
  } catch (error) {
    console.error('Error in uploadFilesToStaging:', error);
    await cleanupStagingFiles(sessionId);
    return { sessionId, fileMetadata: [], error: 'An unexpected error occurred while uploading files' };
  }
}

/**
 * Move files from staging to final hierarchical location (with shared client)
 */
export async function moveFilesToFinalLocationWithClient(
  supabase: any, // Using any to avoid circular type dependencies
  userId: string,
  guestId: string,
  recipeId: string,
  sessionId: string,
  fileMetadata: Array<{originalName: string; tempPath: string; size: number; type: string}>
): Promise<{ urls: string[]; error: string | null }> {
  const finalUrls: string[] = [];

  try {
    for (let i = 0; i < fileMetadata.length; i++) {
      const file = fileMetadata[i];
      const fileExt = file.tempPath.split('.').pop();
      const sequentialNumber = String(i + 1).padStart(3, '0');
      
      // Determine subfolder based on file type
      let subfolder = 'images';
      if (file.type.startsWith('audio/')) {
        subfolder = 'audio';
      } else if (file.type === 'application/pdf') {
        subfolder = 'documents';
      }

      const finalPath = `users/${userId}/guests/${guestId}/recipes/${recipeId}/${subfolder}/${sequentialNumber}.${fileExt}`;

      console.log(`Moving file from staging: ${file.tempPath} → ${finalPath}`);

      // First, check if source file exists
      const { data: listData, error: listError } = await supabase.storage
        .from('recipes')
        .list(`temp/uploads/${sessionId}`, {
          limit: 100,
          offset: 0
        });

      console.log('Files in staging folder:', {
        sessionId,
        files: listData?.map((f: any) => f.name),
        error: listError
      });

      // Copy from temp to final location
      const { data: copyData, error: copyError } = await supabase.storage
        .from('recipes')
        .copy(file.tempPath, finalPath);

      if (copyError) {
        console.error(`Error moving file to final location:`, {
          error: copyError,
          tempPath: file.tempPath,
          finalPath: finalPath
        });
        // Cleanup already moved files and staging files
        await cleanupFinalFiles(userId, guestId, recipeId);
        await cleanupStagingFiles(sessionId);
        return { urls: [], error: `Failed to move ${file.originalName}: ${copyError.message}` };
      }

      console.log(`Successfully moved file to final location:`, { finalPath, copyData });

      // Get public URL for the final location
      const { data: { publicUrl } } = supabase.storage
        .from('recipes')
        .getPublicUrl(finalPath);

      finalUrls.push(publicUrl);
    }

    // Cleanup staging files after successful move
    await cleanupStagingFiles(sessionId);

    return { urls: finalUrls, error: null };
  } catch (error) {
    console.error('Error in moveFilesToFinalLocation:', error);
    // Cleanup on error
    await cleanupFinalFiles(userId, guestId, recipeId);
    await cleanupStagingFiles(sessionId);
    return { urls: [], error: 'An unexpected error occurred while organizing files' };
  }
}

/**
 * Clean up staging files for a session
 */
export async function cleanupStagingFiles(sessionId: string): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    console.log(`Cleaning up staging files for session: ${sessionId}`);
    
    // List all files in the session folder
    const { data: files, error: listError } = await supabase.storage
      .from('recipes')
      .list(`temp/uploads/${sessionId}`);

    if (listError) {
      console.error('Error listing staging files:', listError);
      return;
    }

    if (!files || files.length === 0) {
      console.log('No staging files to cleanup');
      return;
    }

    // Delete all files in the session folder
    const filePaths = files.map(file => `temp/uploads/${sessionId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('recipes')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting staging files:', deleteError);
    } else {
      console.log(`Successfully cleaned up ${filePaths.length} staging files`);
    }
  } catch (error) {
    console.error('Error in cleanupStagingFiles:', error);
  }
}

/**
 * Clean up final files for a recipe (used in error recovery)
 */
export async function cleanupFinalFiles(userId: string, guestId: string, recipeId: string): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    console.log(`Cleaning up final files for recipe: ${recipeId}`);
    
    const basePath = `users/${userId}/guests/${guestId}/recipes/${recipeId}`;
    
    // Clean up all subfolders
    const subfolders = ['images', 'audio', 'documents'];
    
    for (const subfolder of subfolders) {
      const { data: files, error: listError } = await supabase.storage
        .from('recipes')
        .list(`${basePath}/${subfolder}`);

      if (!listError && files && files.length > 0) {
        const filePaths = files.map(file => `${basePath}/${subfolder}/${file.name}`);
        await supabase.storage
          .from('recipes')
          .remove(filePaths);
      }
    }
    
    console.log(`Cleaned up final files for recipe: ${recipeId}`);
  } catch (error) {
    console.error('Error in cleanupFinalFiles:', error);
  }
}

/**
 * Legacy function for backward compatibility - now uses new staging approach
 * @deprecated Use uploadFilesToStaging + moveFilesToFinalLocation instead
 */
export async function uploadRecipeDocuments(
  guestId: string,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> {
  // This is kept for backward compatibility but should not be used for new uploads
  console.warn('uploadRecipeDocuments is deprecated - use new staging approach instead');
  
  const supabase = createSupabaseClient();
  const uploadedUrls: string[] = [];

  try {
    // Upload each file to old structure (for backward compatibility)
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

// Legacy versions that create their own client (for backward compatibility)
export async function uploadFilesToStaging(
  sessionId: string,
  files: File[]
): Promise<{ sessionId: string; fileMetadata: Array<{originalName: string; tempPath: string; size: number; type: string}>; error: string | null }> {
  const supabase = createSupabaseClient();
  return uploadFilesToStagingWithClient(supabase, sessionId, files);
}

export async function moveFilesToFinalLocation(
  userId: string,
  guestId: string,
  recipeId: string,
  sessionId: string,
  fileMetadata: Array<{originalName: string; tempPath: string; size: number; type: string}>
): Promise<{ urls: string[]; error: string | null }> {
  const supabase = createSupabaseClient();
  return moveFilesToFinalLocationWithClient(supabase, userId, guestId, recipeId, sessionId, fileMetadata);
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

/**
 * Upload couple image for a group (with shared client)
 */
export async function uploadGroupCoupleImageWithClient(
  supabase: any,
  groupId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  try {
    console.log('uploadGroupCoupleImageWithClient called with:', {
      groupId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `groups/${groupId}/couple_image.${fileExt}`;

    console.log(`Uploading couple image for group ${groupId} to: ${filePath}`);

    // Remove existing couple image if it exists
    console.log('Removing existing image if present...');
    const { error: removeError } = await supabase.storage
      .from('recipes')
      .remove([filePath]);
    
    if (removeError) {
      console.log('Note: Could not remove existing file (may not exist):', removeError);
    }

    // Upload the new image
    console.log('Starting upload to storage...');
    const { data, error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error(`Error uploading couple image:`, {
        error: uploadError,
        filePath: filePath,
        fileSize: file.size,
        fileType: file.type,
        message: uploadError.message
      });
      return { url: null, error: `Failed to upload image: ${uploadError.message}` };
    }

    console.log(`Successfully uploaded couple image:`, { data });

    // Get public URL for the uploaded image
    console.log('Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('recipes')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error in uploadGroupCoupleImageWithClient:', error);
    return { url: null, error: 'An unexpected error occurred while uploading image' };
  }
}

/**
 * Upload couple image for a group
 */
export async function uploadGroupCoupleImage(
  groupId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createSupabaseClient();
  return uploadGroupCoupleImageWithClient(supabase, groupId, file);
}

/**
 * Delete couple image for a group
 */
export async function deleteGroupCoupleImage(groupId: string): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    console.log(`Deleting couple image for group: ${groupId}`);
    
    // List all possible image extensions to find existing files
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const possiblePaths = extensions.map(ext => `groups/${groupId}/couple_image.${ext}`);
    
    // Try to remove all possible paths (Supabase will ignore non-existent files)
    const { error: deleteError } = await supabase.storage
      .from('recipes')
      .remove(possiblePaths);

    if (deleteError) {
      console.error('Error deleting couple image:', deleteError);
      return { error: deleteError.message };
    }

    console.log(`Successfully deleted couple image for group: ${groupId}`);
    return { error: null };
  } catch (error) {
    console.error('Error in deleteGroupCoupleImage:', error);
    return { error: 'An unexpected error occurred while deleting image' };
  }
}

/**
 * Upload dashboard image for a group (with shared client)
 */
export async function uploadGroupDashboardImageWithClient(
  supabase: any,
  groupId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  try {
    console.log('uploadGroupDashboardImageWithClient called with:', {
      groupId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `groups/${groupId}/dashboard_image.${fileExt}`;

    console.log(`Uploading dashboard image for group ${groupId} to: ${filePath}`);

    // Remove ALL existing dashboard images (with all possible extensions) before uploading
    console.log('Removing all existing dashboard images if present...');
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const possiblePaths = extensions.map(ext => `groups/${groupId}/dashboard_image.${ext}`);
    
    const { error: removeError } = await supabase.storage
      .from('recipes')
      .remove(possiblePaths);
    
    if (removeError) {
      console.log('Note: Could not remove existing files (may not exist):', removeError);
      // Continue anyway - we'll overwrite with upsert
    }

    // Upload the new image
    console.log('Starting upload to storage...');
    const { data, error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error(`Error uploading dashboard image:`, {
        error: uploadError,
        filePath: filePath,
        fileSize: file.size,
        fileType: file.type,
        message: uploadError.message
      });
      return { url: null, error: `Failed to upload image: ${uploadError.message}` };
    }

    console.log(`Successfully uploaded dashboard image:`, { data });

    // Get public URL for the uploaded image
    // Add timestamp to URL to prevent browser caching
    console.log('Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('recipes')
      .getPublicUrl(filePath);

    // Add timestamp query param to force browser to reload the image
    const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
    
    console.log('Generated public URL:', urlWithCacheBuster);
    return { url: urlWithCacheBuster, error: null };
  } catch (error) {
    console.error('Error in uploadGroupDashboardImageWithClient:', error);
    return { url: null, error: 'An unexpected error occurred while uploading image' };
  }
}

/**
 * Upload dashboard image for a group
 */
export async function uploadGroupDashboardImage(
  groupId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createSupabaseClient();
  return uploadGroupDashboardImageWithClient(supabase, groupId, file);
}

/**
 * Delete dashboard image for a group
 */
export async function deleteGroupDashboardImage(groupId: string): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient();
  
  try {
    console.log(`Deleting dashboard image for group: ${groupId}`);
    
    // List all possible image extensions to find existing files
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const possiblePaths = extensions.map(ext => `groups/${groupId}/dashboard_image.${ext}`);
    
    // Try to remove all possible paths (Supabase will ignore non-existent files)
    const { error: deleteError } = await supabase.storage
      .from('recipes')
      .remove(possiblePaths);

    if (deleteError) {
      console.error('Error deleting dashboard image:', deleteError);
      return { error: deleteError.message };
    }

    console.log(`Successfully deleted dashboard image for group: ${groupId}`);
    return { error: null };
  } catch (error) {
    console.error('Error in deleteGroupDashboardImage:', error);
    return { error: 'An unexpected error occurred while deleting image' };
  }
}