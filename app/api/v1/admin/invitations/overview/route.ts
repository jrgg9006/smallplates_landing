/**
 * API Route - Admin Invitations Overview
 * Provides key metrics and statistics for the admin invitations dashboard
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin';

// Create Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  try {
    // Check admin authentication
    await requireAdminAuth();

    console.log('📊 Admin fetching invitations overview');

    // Get current date and 30 days ago for trend calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for performance
    const [
      invitationsResult,
      groupsResult,
      membersResult,
      recipesResult,
      recentInvitationsResult,
      trendsResult
    ] = await Promise.all([
      // 1. Invitation statistics
      supabaseAdmin
        .from('group_invitations')
        .select('status, created_at')
        .order('created_at', { ascending: false }),

      // 2. Groups overview
      supabaseAdmin
        .from('groups')
        .select('id, created_at')
        .order('created_at', { ascending: false }),

      // 3. Group members count
      supabaseAdmin
        .from('group_members')
        .select('id, joined_at, role')
        .order('joined_at', { ascending: false }),

      // 4. Recipe activity in groups
      supabaseAdmin
        .from('guest_recipes')
        .select('id, created_at, group_id')
        .not('group_id', 'is', null),

      // 5. Recent invitation activity
      supabaseAdmin
        .from('group_invitations')
        .select(`
          id,
          email,
          name,
          status,
          created_at,
          expires_at,
          groups (
            id,
            name
          ),
          inviter:profiles!group_invitations_invited_by_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10),

      // 6. Trends data (last 30 days)
      supabaseAdmin
        .from('group_invitations')
        .select('created_at, status')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    // Process invitation statistics
    const invitations = invitationsResult.data || [];
    const totalInvitations = invitations.length;
    const pendingInvitations = invitations.filter(i => i.status === 'pending').length;
    const acceptedInvitations = invitations.filter(i => i.status === 'accepted').length;
    const declinedInvitations = invitations.filter(i => i.status === 'declined').length;
    const expiredInvitations = invitations.filter(i => i.status === 'expired').length;
    
    const conversionRate = totalInvitations > 0 ? (acceptedInvitations / totalInvitations * 100) : 0;

    // Recent invitation activity (last 7 days)
    const recentInvitations = invitations.filter(i => 
      new Date(i.created_at) >= sevenDaysAgo
    ).length;

    // Process groups data
    const groups = groupsResult.data || [];
    const totalGroups = groups.length;
    
    const recentGroups = groups.filter(g => 
      new Date(g.created_at) >= sevenDaysAgo
    ).length;

    // Process members data
    const members = membersResult.data || [];
    const totalMembers = members.length;
    const owners = members.filter(m => m.role === 'owner').length;
    const admins = members.filter(m => m.role === 'admin').length;
    const regularMembers = members.filter(m => m.role === 'member').length;

    const recentMembers = members.filter(m => 
      new Date(m.joined_at) >= sevenDaysAgo
    ).length;

    // Process recipes data
    const groupRecipes = recipesResult.data || [];
    const totalGroupRecipes = groupRecipes.length;
    
    const recentGroupRecipes = groupRecipes.filter(r => 
      new Date(r.created_at) >= sevenDaysAgo
    ).length;

    // Process trends data for charts
    const trendsData = trendsResult.data || [];
    const dailyStats = new Map();

    // Initialize last 30 days with zero counts
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats.set(dateStr, {
        date: dateStr,
        invitations: 0,
        accepted: 0,
        pending: 0
      });
    }

    // Fill in actual data
    trendsData.forEach(item => {
      const dateStr = item.created_at.split('T')[0];
      if (dailyStats.has(dateStr)) {
        const stats = dailyStats.get(dateStr);
        stats.invitations++;
        if (item.status === 'accepted') stats.accepted++;
        if (item.status === 'pending') stats.pending++;
      }
    });

    const chartData = Array.from(dailyStats.values()).slice(-30); // Last 30 days

    // Calculate average response time for accepted invitations
    const acceptedInvitationsWithDates = invitations.filter(i => 
      i.status === 'accepted' && i.created_at
    );

    let averageResponseTime = 0;
    if (acceptedInvitationsWithDates.length > 0) {
      // Note: We don't have acceptance timestamp in current schema
      // This would need to be added to track actual response time
      averageResponseTime = 24; // Placeholder - would calculate from actual data
    }

    // Process recent activity for the feed
    const recentActivity = (recentInvitationsResult.data || []).map(invitation => ({
      id: invitation.id,
      type: 'invitation',
      email: invitation.email,
      name: invitation.name,
      status: invitation.status,
      groupName: (invitation.groups as any)?.name || 'Unknown Group',
      inviterName: (invitation.inviter as any)?.full_name || (invitation.inviter as any)?.email || 'Unknown',
      createdAt: invitation.created_at,
      expiresAt: invitation.expires_at
    }));

    console.log('✅ Successfully compiled invitation overview data');

    return NextResponse.json({
      success: true,
      data: {
        // Key metrics
        overview: {
          totalInvitations,
          acceptedInvitations,
          pendingInvitations,
          declinedInvitations,
          expiredInvitations,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageResponseTime, // In hours
        },

        // Recent activity (last 7 days)
        recentActivity: {
          invitations: recentInvitations,
          groups: recentGroups,
          members: recentMembers,
          recipes: recentGroupRecipes
        },

        // Groups overview
        groups: {
          total: totalGroups,
          recent: recentGroups
        },

        // Members overview  
        members: {
          total: totalMembers,
          owners,
          admins,
          regular: regularMembers,
          recent: recentMembers
        },

        // Recipes overview
        recipes: {
          total: totalGroupRecipes,
          recent: recentGroupRecipes
        },

        // Chart data for trends
        trends: {
          daily: chartData
        },

        // Recent activity feed
        activity: recentActivity,

        // Metadata
        generatedAt: new Date().toISOString(),
        periodDays: 30
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin invitations overview:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unauthorized'
      },
      { status: 401 }
    );
  }
}