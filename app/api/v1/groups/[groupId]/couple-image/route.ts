import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { uploadGroupCoupleImageWithClient, deleteGroupCoupleImage } from '@/lib/supabase/storage';
import {
  generateCoupleImageOgBuffer,
  uploadCoupleImageOgWithClient,
} from '@/lib/supabase/og-image-processor';

/**
 * POST /api/v1/groups/[groupId]/couple-image
 * Upload or update couple image for a group
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    console.log('Starting couple image upload for groupId:', groupId);
    
    if (!groupId) {
      console.error('No groupId provided');
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    console.log('Creating Supabase client...');
    const supabase = await createSupabaseServer();
    
    // Get current user
    console.log('Getting current user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.log('User authenticated:', user.id);

    // Check if user has permission to modify this group (owner or admin)
    console.log('Checking group membership for user:', user.id, 'in group:', groupId);
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single();

    console.log('Membership check result:', { membership, memberError });
    if (memberError || !membership) {
      console.error('Permission denied - not a group member:', { memberError, membership });
      return NextResponse.json(
        { error: 'Permission denied. You must be a group member to update the couple image.' },
        { status: 403 }
      );
    }
    
    // Allow any group member (owner, admin, captain, member) to upload couple image
    console.log('User is a group member with role:', membership.role);

    // Parse form data
    console.log('Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('image') as File;
    console.log('File received:', file ? { name: file.name, type: file.type, size: file.size } : 'No file');

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Reason: client compresses to ~2000px JPEG before upload, so anything
    // arriving here should be well under 2MB. 10MB cap is generous headroom
    // in case the client falls back to raw upload.
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Upload image to storage
    console.log('Starting image upload to storage...');
    const { url, error: uploadError } = await uploadGroupCoupleImageWithClient(
      supabase,
      groupId,
      file
    );

    console.log('Upload result:', { url, uploadError });
    if (uploadError || !url) {
      console.error('Upload failed:', uploadError);
      return NextResponse.json(
        { error: uploadError || 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Reason: pre-process the OG version (1200x630 JPEG <300KB) at upload time.
    // WhatsApp's crawler has a tight timeout and caches failures with no retry —
    // serving a ready-made file from storage is the only reliable path.
    // Failure here is non-fatal: the original upload succeeded, so we leave
    // og_url null and generateMetadata falls back to /api/og-image proxy.
    let ogUrl: string | null = null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ogBuffer = await generateCoupleImageOgBuffer(
        Buffer.from(arrayBuffer),
        50, // newly uploaded — default centered focal point
        50,
      );
      const ogResult = await uploadCoupleImageOgWithClient(supabase, groupId, ogBuffer);
      if (ogResult.error) {
        console.error('OG image upload failed (non-fatal):', ogResult.error);
      } else {
        ogUrl = ogResult.url;
      }
    } catch (ogErr) {
      console.error('OG image generation failed (non-fatal):', ogErr);
    }

    // Update groups table with new image URL
    console.log('Updating groups table with URL:', url);
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        couple_image_url: url,
        couple_image_og_url: ogUrl,
        couple_image_position_y: 50,
        couple_image_position_x: 50,
      })
      .eq('id', groupId);

    console.log('Database update result:', { updateError });
    if (updateError) {
      console.error('Database update failed:', updateError);
      // If database update fails, clean up the uploaded file
      await deleteGroupCoupleImage(groupId);
      return NextResponse.json(
        { error: 'Failed to save image reference' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: url,
      message: 'Couple image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading couple image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/groups/[groupId]/couple-image
 * Delete couple image for a group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    
    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to modify this group (owner or admin)
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Permission denied. You must be a group member to delete the couple image.' },
        { status: 403 }
      );
    }
    
    // Allow any group member (owner, admin, captain, member) to delete couple image

    // Delete image from storage
    const { error: deleteStorageError } = await deleteGroupCoupleImage(groupId);
    if (deleteStorageError) {
      console.error('Error deleting image from storage:', deleteStorageError);
      // Continue anyway - remove from database even if storage deletion fails
    }

    // Update groups table to remove image URL
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        couple_image_url: null,
        couple_image_og_url: null,
        couple_image_position_y: 50,
        couple_image_position_x: 50,
      })
      .eq('id', groupId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to remove image reference' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Couple image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting couple image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/groups/[groupId]/couple-image
 * Update the position (focal point) of the couple image
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Permission denied. You must be a group member to update the couple image.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const positionY = body.position_y;
    const positionX = body.position_x;

    const updateData: Record<string, number> = {};

    if (positionY !== undefined) {
      if (typeof positionY !== 'number' || positionY < 0 || positionY > 100) {
        return NextResponse.json(
          { error: 'position_y must be a number between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.couple_image_position_y = Math.round(positionY);
    }

    if (positionX !== undefined) {
      if (typeof positionX !== 'number' || positionX < 0 || positionX > 100) {
        return NextResponse.json(
          { error: 'position_x must be a number between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.couple_image_position_x = Math.round(positionX);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one of position_x or position_y is required' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update image position' },
        { status: 500 }
      );
    }

    // Reason: regenerate the OG image with the new focal point so WhatsApp/Meta
    // previews match what the user just repositioned in the dashboard. The
    // freshly-stamped og_url also serves as the version param on the share URL,
    // which forces WhatsApp to re-crawl rather than serve a cached preview.
    // Non-fatal: position update already succeeded; if regen fails we just
    // keep the previous og_url and the proxy still works as fallback.
    try {
      const { data: groupRow } = await supabase
        .from('groups')
        .select('couple_image_url, couple_image_position_x, couple_image_position_y')
        .eq('id', groupId)
        .single();

      if (groupRow?.couple_image_url) {
        const finalX = updateData.couple_image_position_x ?? groupRow.couple_image_position_x ?? 50;
        const finalY = updateData.couple_image_position_y ?? groupRow.couple_image_position_y ?? 50;

        // Reason: strip cache-buster query so we fetch the raw stored file
        const cleanUrl = groupRow.couple_image_url.split('?')[0];
        const response = await fetch(cleanUrl);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const ogBuffer = await generateCoupleImageOgBuffer(buffer, finalX, finalY);
          const ogResult = await uploadCoupleImageOgWithClient(supabase, groupId, ogBuffer);
          if (!ogResult.error && ogResult.url) {
            await supabase
              .from('groups')
              .update({ couple_image_og_url: ogResult.url })
              .eq('id', groupId);
          } else if (ogResult.error) {
            console.error('OG regen on PATCH — upload failed (non-fatal):', ogResult.error);
          }
        } else {
          console.error('OG regen on PATCH — could not fetch original (non-fatal):', response.status);
        }
      }
    } catch (ogErr) {
      console.error('OG regen on PATCH failed (non-fatal):', ogErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Couple image position updated successfully'
    });

  } catch (error) {
    console.error('Error updating couple image position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}