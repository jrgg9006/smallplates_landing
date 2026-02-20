import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ServerClient } from 'postmark';
import { buildShowcaseEmailHTML } from '@/lib/email/showcase-template';

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const {
      guest_id,
      recipe_id,
      guest_name,
      guest_email,
      recipe_name,
      couple_name,
      showcase_image_url,
    } = await request.json();

    if (!guest_id || !recipe_id || !guest_email || !showcase_image_url) {
      return NextResponse.json(
        { error: 'guest_id, recipe_id, guest_email, and showcase_image_url are required' },
        { status: 400 }
      );
    }

    // Download the spread image from Supabase Storage and convert to base64
    const imageResponse = await fetch(showcase_image_url);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download showcase image' },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const contentType = showcase_image_url.includes('.png') ? 'image/png' : 'image/jpeg';

    // Build couple name variants for the template
    const coupleNamePlain = couple_name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');

    const html = buildShowcaseEmailHTML({
      guestName: guest_name || 'Friend',
      coupleName: coupleNameHtml,
      coupleNamePlain,
      recipeName: recipe_name || 'Your recipe',
    });

    const displayName = guest_name || 'Friend';
    const subject = `You're in the book, ${displayName}.`;

    // Send via Postmark with CID attachment
    const result = await postmarkClient.sendEmail({
      From: `Team Small Plates & Co. <${process.env.POSTMARK_FROM_EMAIL || 'team@smallplatesandcompany.com'}>`,
      To: guest_email,
      Subject: subject,
      HtmlBody: html,
      MessageStream: 'outbound',
      Attachments: [
        {
          Name: 'recipe-spread.png',
          Content: imageBase64,
          ContentType: contentType,
          ContentID: 'cid:recipe-spread',
        },
      ],
    });

    const sentAt = new Date().toISOString();

    // Log to communication_log with recipe_id in content for per-recipe tracking
    const { error: logError } = await supabase
      .from('communication_log')
      .insert({
        guest_id,
        user_id: user.id,
        type: 'recipe_showcase',
        channel: 'email',
        subject: subject,
        content: recipe_id,
        status: 'sent',
        sent_at: sentAt,
      });

    if (logError) {
      console.error('Failed to log showcase email:', logError.message);
    }

    return NextResponse.json({
      success: true,
      postmark_message_id: result.MessageID,
      sent_at: sentAt,
    });
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

    const { guest_id, recipe_id } = await request.json();

    if (!guest_id || !recipe_id) {
      return NextResponse.json(
        { error: 'guest_id and recipe_id are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('communication_log')
      .delete()
      .eq('guest_id', guest_id)
      .eq('type', 'recipe_showcase')
      .eq('content', recipe_id);

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
