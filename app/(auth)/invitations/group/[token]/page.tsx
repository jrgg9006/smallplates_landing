"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { GroupJoinForm } from "@/components/groups/GroupJoinForm";

interface GroupInvitationData {
  email: string;
  name: string | null;
  expiresAt: string;
  group: {
    id: string;
    name: string;
    description?: string;
    coupleImageUrl?: string | null;
  };
  inviter: {
    name: string;
  };
}

export default function GroupInvitationPage() {
  const params = useParams();
  const tokenParam = params?.token as string;

  const [token, setToken] = useState<string>('');
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Invalid Invitation");
  const [invitationData, setInvitationData] = useState<GroupInvitationData | null>(null);

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [tokenParam]);

  useEffect(() => {
    if (!token) return;

    const verifyInvitation = async () => {
      try {
        setVerifying(true);
        setError(null);

        const response = await fetch(`/api/v1/invitations/group/${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.status === 'expired') {
            setErrorTitle("Invitation Expired");
            setError("This invitation has expired. Ask the person who invited you to send a new one.");
          } else if (data.status === 'used') {
            setErrorTitle("Invitation Already Used");
            setError("This invitation has already been accepted. If you already have an account, sign in from the home page.");
          } else {
            setErrorTitle("Invalid Invitation");
            setError(data.error || "This invitation link is not valid.");
          }
          return;
        }

        setInvitationData(data.data);
      } catch (err) {
        console.error('Error verifying invitation:', err);
        setError('Failed to verify invitation. Please try again.');
      } finally {
        setVerifying(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const handleJoin = async (formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const response = await fetch(`/api/v1/invitations/group/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
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

  // Reason: Split invitation name into firstName/lastName for GroupJoinForm preFilledData
  const preFilledData = invitationData ? {
    firstName: invitationData.name?.split(' ')[0] || '',
    lastName: invitationData.name?.split(' ').slice(1).join(' ') || '',
    email: invitationData.email || ''
  } : undefined;

  return (
    <GroupJoinForm
      title="Join the Cookbook"
      groupData={invitationData ? {
        id: invitationData.group.id,
        name: invitationData.group.name,
        description: invitationData.group.description
      } : null}
      inviterName={invitationData?.inviter.name}
      coupleImageUrl={invitationData?.group.coupleImageUrl || null}
      preFilledData={preFilledData}
      onJoin={handleJoin}
      verifying={verifying}
      verifyMessage="Verifying your invitation..."
      verifyError={error}
      errorTitle={errorTitle}
      footerText="By joining this cookbook, you agree to share recipes and collaborate with group members."
      autoFocus={true}
    />
  );
}
