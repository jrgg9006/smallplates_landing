"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { GroupJoinForm } from "@/components/groups/GroupJoinForm";

interface GroupInvitationData {
  email: string;
  name: string;
  expiresAt: string;
  createdAt: string;
  group: {
    id: string;
    name: string;
    description?: string;
    visibility: string;
    createdAt: string;
  };
  inviter: {
    name: string;
    email?: string;
  };
}

export default function GroupInvitationPage() {
  const params = useParams();
  const tokenParam = params?.token as string;
  
  const [token, setToken] = useState<string>('');
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<GroupInvitationData | null>(null);

  // Extract token from params
  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [tokenParam]);

  // Verify invitation token when token is available
  useEffect(() => {
    if (token) {
      verifyInvitation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyInvitation = async () => {
    if (!token) {
      return;
    }
    
    try {
      setVerifying(true);
      setError(null);

      const response = await fetch(`/api/v1/invitations/group/verify/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid invitation');
        return;
      }

      setInvitationData(data.data);

    } catch (err) {
      console.error('Error verifying invitation:', err);
      setError('Failed to verify invitation');
    } finally {
      setVerifying(false);
    }
  };

  const handleJoin = async (formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const response = await fetch('/api/v1/invitations/group/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        ...formData
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to join group',
        data: data.data
      };
    }

    return {
      success: true,
      data: data.data
    };
  };

  return (
    <GroupJoinForm
      title="You've been invited to join a group!"
      groupData={invitationData ? {
        id: invitationData.group.id,
        name: invitationData.group.name,
        description: invitationData.group.description
      } : null}
      inviterName={invitationData?.inviter.name}
      preFilledData={invitationData ? {
        firstName: invitationData.name?.split(' ')[0] || '',
        lastName: invitationData.name?.split(' ').slice(1).join(' ') || '',
        email: invitationData.email || ''
      } : undefined}
      onJoin={handleJoin}
      verifying={verifying}
      verifyMessage="Verifying invitation..."
      verifyError={error}
      errorTitle="Invalid Invitation"
      footerText="By joining this group, you agree to share recipes and collaborate with group members."
    />
  );
}