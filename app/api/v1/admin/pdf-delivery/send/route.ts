import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ServerClient } from 'postmark';
import { buildPdfDeliveryEmailHTML, buildPdfDeliverySubjectLine } from '@/lib/email/pdf-delivery-template';

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const {
      guest_id,
      guest_name,
      guest_email,
      group_id,
      couple_name,
      total_recipe_count,
      total_contributor_count,
    } = await request.json() as {
      guest_id: string;
      guest_name: string;
      guest_email: string;
      group_id: string;
      couple_name: string;
      total_recipe_count: number;
      total_contributor_count: number;
    };

    if (!guest_id || !guest_email || !group_id) {
      return NextResponse.json(
        { error: 'guest_id, guest_email, and group_id are required' },
        { status: 400 }
      );
    }

    // Fetch pdf_url and verify book is printed
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('pdf_url, book_status, couple_display_name')
      .eq('id', group_id)
      .single();

    if (groupErr || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!group.pdf_url) {
      return NextResponse.json(
        { error: 'No PDF uploaded for this group yet' },
        { status: 400 }
      );
    }

    // Fetch the PDF binary from storage for the email attachment
    const pdfResponse = await fetch(group.pdf_url);
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch PDF from storage' },
        { status: 500 }
      );
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    const coupleNamePlain = couple_name || group.couple_display_name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smallplatesandcompany.com';
    const unsubscribePageUrl = `${baseUrl}/unsubscribe?gid=${guest_id}`;
    const unsubscribeApiUrl = `${baseUrl}/api/v1/unsubscribe?gid=${guest_id}`;
    const unsubMailto = `mailto:team@smallplatesandcompany.com?subject=Unsubscribe&body=Guest%20ID%3A%20${encodeURIComponent(guest_id)}`;

    const html = buildPdfDeliveryEmailHTML({
      guestName: guest_name || 'Friend',
      coupleName: coupleNameHtml,
      coupleNamePlain,
      totalRecipeCount: total_recipe_count,
      totalContributorCount: total_contributor_count,
      // Reason: bookCoverCid intentionally omitted — image generation pipeline is pending
      guestId: guest_id,
      unsubscribeUrl: unsubscribePageUrl,
    });

    const subject = buildPdfDeliverySubjectLine(coupleNamePlain);

    // Reason: use couple name as sender so the email feels personal to the recipient
    const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com';
    const fromName = coupleNamePlain !== 'The couple'
      ? `${coupleNamePlain} via Small Plates`
      : 'Team Small Plates & Co.';

    await postmarkClient.sendEmail({
      From: `${fromName} <${fromEmail}>`,
      ReplyTo: 'team@smallplatesandcompany.com',
      To: guest_email,
      Subject: subject,
      HtmlBody: html,
      MessageStream: 'outbound',
      Attachments: [
        {
          Name: `${coupleNamePlain.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_')}_Cookbook.pdf`,
          Content: pdfBase64,
          ContentType: 'application/pdf',
          // Reason: PDF attachments are inline=false (no CID needed); Postmark requires the field
          ContentID: '',
        },
      ],
      Headers: [
        { Name: 'List-Unsubscribe', Value: `<${unsubscribeApiUrl}>, <${unsubMailto}>` },
        { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
      ],
    });

    const sentAt = new Date().toISOString();

    const { error: logError } = await supabase
      .from('communication_log')
      .insert({
        guest_id,
        user_id: user.id,
        type: 'pdf_delivery' as const,
        channel: 'email' as const,
        subject,
        content: group_id,
        status: 'sent' as const,
        sent_at: sentAt,
      });

    if (logError) {
      console.error('Failed to log pdf_delivery email:', logError.message);
    }

    return NextResponse.json({ success: true, sent_at: sentAt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Send failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const { guest_id } = await request.json() as { guest_id: string };

    if (!guest_id) {
      return NextResponse.json({ error: 'guest_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('communication_log')
      .delete()
      .eq('guest_id', guest_id)
      .eq('type', 'pdf_delivery');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reset failed' },
      { status: 500 }
    );
  }
}
