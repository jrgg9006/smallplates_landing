import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Reason: Postmark's per-message attachment limit is 15MB. Keeping PDF max below
// that ceiling prevents silently broken sends. Flag this if books grow larger.
const MAX_PDF_SIZE = 14 * 1024 * 1024; // 14MB

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const formData = await request.formData();
    const file = formData.get('pdf') as File | null;
    const groupId = formData.get('group_id') as string | null;

    if (!file || !groupId) {
      return NextResponse.json(
        { error: 'pdf and group_id are required' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `PDF must be under 14MB (Postmark attachment limit)` },
        { status: 400 }
      );
    }

    const storagePath = `pdfs/${groupId}/cookbook.pdf`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('recipes')
      .getPublicUrl(storagePath);

    const pdfUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('groups')
      .update({ pdf_url: pdfUrl })
      .eq('id', groupId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ pdf_url: pdfUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
