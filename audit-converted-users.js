const { createClient } = require('@supabase/supabase-js');

// Comprehensive audit of all "converted" waitlist users
async function auditConvertedUsers() {
  const supabaseAdmin = createClient(
    'https://iinnpndsxepvviafrmwz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpbm5wbmRzeGVwdnZpYWZybXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc3NjI0MCwiZXhwIjoyMDc1MzUyMjQwfQ.8uaJ_MyOYUwLQfkYGRvuzkGX_Hy53kXfcClfVK0jQ_k',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  console.log('🔍 AUDITING ALL "CONVERTED" WAITLIST USERS...\n');

  try {
    // 1. Get all waitlist users marked as "converted"
    const { data: convertedUsers, error: waitlistError } = await supabaseAdmin
      .from('waitlist')
      .select('*')
      .eq('status', 'converted')
      .order('converted_at', { ascending: false });

    if (waitlistError) {
      console.log('❌ Error fetching converted users:', waitlistError);
      return;
    }

    console.log(`📊 Found ${convertedUsers.length} users marked as "converted"\n`);

    // Categories for our audit
    const realAccounts = [];
    const brokenConversions = [];
    const incompleteSetups = [];
    const suspiciousConversions = [];

    // 2. Check each user's actual account status
    const { data: allAuthUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError);
      return;
    }

    for (const waitlistUser of convertedUsers) {
      console.log(`🔍 Checking: ${waitlistUser.email}`);
      
      // Find corresponding auth user
      const authUser = allAuthUsers.users.find(u => u.email === waitlistUser.email);
      
      if (!authUser) {
        console.log('  ❌ NO AUTH ACCOUNT - This is definitely broken!');
        brokenConversions.push({
          ...waitlistUser,
          issue: 'no_auth_account',
          severity: 'critical'
        });
        continue;
      }

      console.log(`  ✅ Auth account exists (ID: ${authUser.id})`);
      console.log(`    - Created: ${authUser.created_at}`);
      console.log(`    - Last sign in: ${authUser.last_sign_in_at || 'NEVER'}`);
      console.log(`    - Email confirmed at: ${authUser.email_confirmed_at || 'NEVER'}`);
      console.log(`    - Confirmation sent at: ${authUser.confirmation_sent_at || 'NEVER'}`);

      // Check if user has profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const hasProfile = !profileError && profile;
      const hasSignedIn = authUser.last_sign_in_at !== null;
      const emailConfirmed = authUser.email_confirmed_at !== null;
      const wasInvited = authUser.user_metadata?.invited_from_waitlist === true;

      console.log(`    - Has profile: ${hasProfile ? 'Yes' : 'No'}`);
      console.log(`    - Was invited: ${wasInvited ? 'Yes' : 'No'}`);
      
      // KEY CHECK: Has user actually set a password?
      const hasActualPassword = emailConfirmed;
      console.log(`    - 🔑 HAS SET PASSWORD: ${hasActualPassword ? 'YES' : 'NO'}`);
      
      if (!hasActualPassword) {
        console.log(`    - ⚠️ This user NEVER completed password setup!`);
      }

      if (hasProfile) {
        console.log(`    - Profile created: ${profile.created_at}`);
      }

      // Check timing: was converted_at BEFORE last_sign_in?
      const convertedAt = new Date(waitlistUser.converted_at);
      const lastSignIn = authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : null;
      const profileCreated = hasProfile ? new Date(profile.created_at) : null;
      
      let timingSuspicious = false;
      if (lastSignIn && convertedAt < lastSignIn) {
        // This is actually good - converted after they signed in
        console.log(`    ✅ Timing OK: Converted after sign-in`);
      } else if (lastSignIn) {
        console.log(`    ⚠️ Timing suspicious: Converted before sign-in`);
        timingSuspicious = true;
      }

      // NEW CATEGORIZATION LOGIC - Password status is the key indicator
      if (!hasActualPassword) {
        // User never set a password - this is the real issue!
        console.log('  🚨 CRITICAL: Marked "converted" but NEVER SET PASSWORD');
        brokenConversions.push({
          ...waitlistUser,
          authUser: { id: authUser.id, created_at: authUser.created_at, email_confirmed_at: authUser.email_confirmed_at },
          issue: 'no_password_set',
          severity: 'critical',
          canTryForgotPassword: false
        });
      } else if (!hasSignedIn && !hasProfile) {
        console.log('  ⚠️ INCOMPLETE: Has password but no sign-in/profile yet');
        incompleteSetups.push({
          ...waitlistUser,
          authUser: { id: authUser.id, created_at: authUser.created_at, email_confirmed_at: authUser.email_confirmed_at },
          issue: 'password_set_but_incomplete',
          severity: 'moderate'
        });
      } else if (!hasSignedIn && hasProfile) {
        console.log('  ⚠️ INCOMPLETE: Has password and profile but never signed in');
        incompleteSetups.push({
          ...waitlistUser,
          authUser: { id: authUser.id, created_at: authUser.created_at, email_confirmed_at: authUser.email_confirmed_at },
          profile: profile,
          issue: 'has_profile_no_signin',
          severity: 'moderate'
        });
      } else if (hasSignedIn && !hasProfile) {
        console.log('  ⚠️ INCOMPLETE: Signed in but no profile');
        incompleteSetups.push({
          ...waitlistUser,
          authUser: { id: authUser.id, created_at: authUser.created_at, last_sign_in_at: authUser.last_sign_in_at, email_confirmed_at: authUser.email_confirmed_at },
          issue: 'signin_no_profile',
          severity: 'moderate'
        });
      } else if (timingSuspicious) {
        console.log('  ⚠️ SUSPICIOUS: Converted before completing setup (but account works)');
        suspiciousConversions.push({
          ...waitlistUser,
          authUser: { id: authUser.id, created_at: authUser.created_at, last_sign_in_at: authUser.last_sign_in_at, email_confirmed_at: authUser.email_confirmed_at },
          profile: profile,
          issue: 'converted_too_early',
          severity: 'low'
        });
      } else {
        console.log('  ✅ PERFECT: Complete working account');
        realAccounts.push({
          ...waitlistUser,
          authUser: { id: authUser.id, last_sign_in_at: authUser.last_sign_in_at, email_confirmed_at: authUser.email_confirmed_at },
          profile: profile,
          status: 'legitimate'
        });
      }
      
      console.log(''); // Empty line for readability
    }

    // 3. Print summary report
    console.log('='.repeat(60));
    console.log('📊 AUDIT SUMMARY REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ LEGITIMATE CONVERSIONS: ${realAccounts.length}`);
    if (realAccounts.length > 0) {
      realAccounts.forEach(user => {
        console.log(`  - ${user.email} (signed in: ${user.authUser.last_sign_in_at})`);
      });
    }
    
    console.log(`\n🚨 BROKEN CONVERSIONS (CRITICAL): ${brokenConversions.length}`);
    if (brokenConversions.length > 0) {
      console.log('   These users are marked "converted" but NEVER set a password!');
      brokenConversions.forEach(user => {
        console.log(`  - ${user.email} (${user.issue}) - email_confirmed_at: ${user.authUser?.email_confirmed_at || 'NEVER'}`);
      });
    }
    
    console.log(`\n⚠️ INCOMPLETE SETUPS (MODERATE): ${incompleteSetups.length}`);
    if (incompleteSetups.length > 0) {
      incompleteSetups.forEach(user => {
        console.log(`  - ${user.email} (${user.issue})`);
      });
    }
    
    console.log(`\n🤔 SUSPICIOUS TIMING (LOW): ${suspiciousConversions.length}`);
    if (suspiciousConversions.length > 0) {
      suspiciousConversions.forEach(user => {
        console.log(`  - ${user.email} (${user.issue})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 RECOMMENDATIONS:');
    console.log('='.repeat(60));

    if (brokenConversions.length > 0) {
      console.log(`\n🚨 CRITICAL: ${brokenConversions.length} users need immediate attention`);
      console.log('   → Reset their status to "invited"');
      console.log('   → Send fresh invitation emails');
    }

    if (incompleteSetups.length > 0) {
      console.log(`\n⚠️ MODERATE: ${incompleteSetups.length} users have partial setups`);
      console.log('   → May need password reset or re-invitation');
      console.log('   → Contact individually to understand their situation');
    }

    if (suspiciousConversions.length > 0) {
      console.log(`\n🤔 SUSPICIOUS: ${suspiciousConversions.length} users converted too early`);
      console.log('   → These might be victims of the old timing bug');
      console.log('   → But they do have working accounts now');
    }

    const successRate = (realAccounts.length / convertedUsers.length * 100).toFixed(1);
    console.log(`\n📊 SUCCESS RATE: ${successRate}% (${realAccounts.length}/${convertedUsers.length})`);

  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

auditConvertedUsers();