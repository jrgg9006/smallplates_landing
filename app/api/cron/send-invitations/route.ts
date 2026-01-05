import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendGuestInvitationEmail } from '@/lib/email/send-invitation-email';

// Create a Supabase client with service role for cron jobs
// This bypasses RLS policies
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email schedule: which email to send on which day
const EMAIL_SCHEDULE = [
  { day: 0, emailNumber: 1 },
  { day: 3, emailNumber: 2 },
  { day: 6, emailNumber: 3 },
  { day: 9, emailNumber: 4 },
] as const;

// After this many days with all emails sent, mark as completed
const COMPLETION_DAY = 10;

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🚀 Starting invitation email cron job...');

  try {
    // 1. Get all guests with status 'invited'
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from('guests')
      .select(`
        *,
        group:groups!inner (
          id,
          couple_first_name,
          partner_first_name,
          couple_image_url,
          created_by
        )
      `)
      .eq('status', 'invited')
      .not('email', 'is', null)
      .not('email', 'like', 'NO_EMAIL_%')
      .not('invitation_started_at', 'is', null);

    if (guestsError) {
      console.error('Error fetching guests:', guestsError);
      return NextResponse.json({ error: guestsError.message }, { status: 500 });
    }

    if (!guests || guests.length === 0) {
      console.log('No guests to process');
      return NextResponse.json({ 
        success: true, 
        message: 'No guests to process',
        stats: { processed: 0, emailsSent: 0, completed: 0, errors: 0 }
      });
    }

    console.log(`Found ${guests.length} guests to process`);

    // 2. Get collection link tokens for all unique group creators
    const creatorIds = [...new Set(guests.map(g => g.group.created_by))];
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, collection_link_token')
      .in('id', creatorIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Create a map for quick lookup
    const tokenMap = new Map(profiles?.map(p => [p.id, p.collection_link_token]) || []);

    // 3. Process each guest
    const stats = {
      processed: 0,
      emailsSent: 0,
      completed: 0,
      errors: 0,
    };

    for (const guest of guests) {
      stats.processed++;
      
      try {
        // Calculate days since invitation started
        const startDate = new Date(guest.invitation_started_at);
        const now = new Date();
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const emailsSentCount = guest.emails_sent_count || 0;

        console.log(`Processing ${guest.first_name} (${guest.email}): Day ${daysSinceStart}, Emails sent: ${emailsSentCount}`);

        // Check if we should mark as completed
        if (daysSinceStart >= COMPLETION_DAY && emailsSentCount >= 4) {
          console.log(`Marking ${guest.first_name} as completed`);
          await supabaseAdmin
            .from('guests')
            .update({ status: 'completed' })
            .eq('id', guest.id);
          stats.completed++;
          continue;
        }

        // Find the highest email number we should have sent by now
        const targetEmail = [...EMAIL_SCHEDULE]
          .reverse()
          .find(schedule => daysSinceStart >= schedule.day);

        if (!targetEmail || emailsSentCount >= targetEmail.emailNumber) {
          console.log(`No email to send for ${guest.first_name} today`);
          continue;
        }

        // Determine which email to send (the next one after what we've already sent)
        const emailToSend = (emailsSentCount + 1) as 1 | 2 | 3 | 4;

        if (emailToSend > 4) {
          console.log(`All emails already sent for ${guest.first_name}`);
          continue;
        }

        // Get collection link token
        const collectionLinkToken = tokenMap.get(guest.group.created_by);
        if (!collectionLinkToken) {
          console.error(`No collection link token found for guest ${guest.id}`);
          stats.errors++;
          continue;
        }

        // Build couple name
        const coupleName = [
          guest.group.couple_first_name,
          guest.group.partner_first_name
        ].filter(Boolean).join(' & ') || 'The Couple';

        // Build collection link with group_id parameter
        const collectionLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://smallplatesandcompany.com'}/collect/${collectionLinkToken}?group=${guest.group_id}`;

        // Send the email
        console.log(`Sending email ${emailToSend} to ${guest.email}`);
        const result = await sendGuestInvitationEmail({
          to: guest.email,
          guestName: guest.first_name,
          coupleName,
          collectionLink,
          coupleImageUrl: guest.group.couple_image_url || undefined,
          emailNumber: emailToSend,
        });

        if (result.success) {
          // Update the guest record
          await supabaseAdmin
            .from('guests')
            .update({
              emails_sent_count: emailToSend,
              last_email_sent_at: new Date().toISOString(),
            })
            .eq('id', guest.id);
          
          stats.emailsSent++;
          console.log(`✅ Email ${emailToSend} sent successfully to ${guest.email}`);
        } else {
          console.error(`Failed to send email to ${guest.email}:`, result.error);
          stats.errors++;
        }
      } catch (error) {
        console.error(`Error processing guest ${guest.id}:`, error);
        stats.errors++;
      }
    }

    console.log('📊 Cron job completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      stats,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}