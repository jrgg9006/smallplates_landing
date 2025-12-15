"use client";

import React, { useState, useEffect } from "react";
import { GroupJoinForm } from "@/components/groups/GroupJoinForm";

interface GroupData {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface GroupJoinPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupJoinPage({ params }: GroupJoinPageProps) {
  const [groupId, setGroupId] = useState<string>('');
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<GroupData | null>(null);

  // Extract group ID from params
  useEffect(() => {
    params.then(({ id }) => setGroupId(id));
  }, [params]);

  // Verify group exists when group ID is available
  useEffect(() => {
    if (groupId) {
      verifyGroup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const verifyGroup = async () => {
    if (!groupId) {
      return;
    }
    
    try {
      setVerifying(true);
      setError(null);

      const response = await fetch(`/api/v1/groups/${groupId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Group not found');
        return;
      }

      setGroupData(data.data);

    } catch (err) {
      console.error('Error verifying group:', err);
      setError('Failed to load group information');
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
    const response = await fetch(`/api/v1/groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

  return (
    <GroupJoinForm
      title="Join the Cookbook"
      subtitle=""
      groupData={groupData ? {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description
      } : null}
      onJoin={handleJoin}
      verifying={verifying}
      verifyMessage="Loading cookbook information..."
      verifyError={error}
      errorTitle="Group Not Found"
      footerText="By joining this cookbook, you agree to share recipes and collaborate with group members."
      autoFocus={true}
    />
  );
}

