import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ServerClient } from 'postmark';
import { buildShowcaseEmailHTML } from '@/lib/email/showcase-template';

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

interface RecipePayload {
  recipe_id: string;
  recipe_name: string;
  showcase_image_url: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const {
      guest_id,
      guest_name,
      guest_email,
      couple_name,
      recipes,
      override,
    } = await request.json() as {
      guest_id: string;
      guest_name: string;
      guest_email: string;
      couple_name: string;
      recipes: RecipePayload[];
      override?: boolean;
    };

    if (!guest_id || !guest_email || !recipes?.length) {
      return NextResponse.json(
        { error: 'guest_id, guest_email, and at least one recipe are required' },
        { status: 400 }
      );
    }

    // Reason: hard guard — never send a showcase email for a book that hasn't been
    // printed yet, otherwise we could spoil the surprise for the couple. The UI
    // already blocks this, but the backend must never trust the UI alone.
    const { data: guestRow, error: guestErr } = await supabase
      .from('guests')
      .select('group_id, groups:group_id ( book_status )')
      .eq('id', guest_id)
      .single();

    if (guestErr || !guestRow) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    const guestGroup = guestRow.groups as unknown as { book_status: string | null } | null;
    // Reason: admin may pass override=true to bypass the printed check for tests/demos
    if (guestGroup?.book_status !== 'printed' && !override) {
      return NextResponse.json(
        { error: 'Cannot send showcase: book is not printed yet' },
        { status: 403 }
      );
    }

    // Download all spread images and convert to base64
    const attachments = await Promise.all(
      recipes.map(async (recipe, index) => {
        const imageResponse = await fetch(recipe.showcase_image_url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image for ${recipe.recipe_name}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const contentType = recipe.showcase_image_url.includes('.png') ? 'image/png' : 'image/jpeg';

        return {
          Name: `recipe-spread-${index}.png`,
          Content: imageBase64,
          ContentType: contentType,
          ContentID: `cid:recipe-spread-${index}`,
        };
      })
    );

    const coupleNamePlain = couple_name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');

    const html = buildShowcaseEmailHTML({
      guestName: guest_name || 'Friend',
      coupleName: coupleNameHtml,
      coupleNamePlain,
      guestId: guest_id,
      recipes: recipes.map((r, i) => ({
        recipeName: r.recipe_name || 'Your recipe',
        cid: `cid:recipe-spread-${i}`,
      })),
    });

    const displayName = guest_name || 'Friend';
    const subject = `You're in the book, ${displayName}.`;

    // Reason: use couple name as sender display name so it feels personal,
    // but keep our verified domain email to maintain deliverability (SPF/DKIM/DMARC)
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
      Attachments: attachments,
    });

    const sentAt = new Date().toISOString();

    // Reason: insert 1 log entry per recipe to keep per-recipe tracking compatible
    const logEntries = recipes.map(recipe => ({
      guest_id,
      user_id: user.id,
      type: 'recipe_showcase' as const,
      channel: 'email' as const,
      subject,
      content: recipe.recipe_id,
      status: 'sent' as const,
      sent_at: sentAt,
    }));

    const { error: logError } = await supabase
      .from('communication_log')
      .insert(logEntries);

    if (logError) {
      console.error('Failed to log showcase email:', logError.message);
    }

    return NextResponse.json({
      success: true,
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

    const { guest_id, recipe_ids } = await request.json() as {
      guest_id: string;
      recipe_ids: string[];
    };

    if (!guest_id || !recipe_ids?.length) {
      return NextResponse.json(
        { error: 'guest_id and recipe_ids are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('communication_log')
      .delete()
      .eq('guest_id', guest_id)
      .eq('type', 'recipe_showcase')
      .in('content', recipe_ids);

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
