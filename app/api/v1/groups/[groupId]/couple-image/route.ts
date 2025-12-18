import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { uploadGroupCoupleImageWithClient, deleteGroupCoupleImage } from '@/lib/supabase/storage';

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

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
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

    // Update groups table with new image URL
    console.log('Updating groups table with URL:', url);
    const { error: updateError } = await supabase
      .from('groups')
      .update({ couple_image_url: url })
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
      .update({ couple_image_url: null })
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