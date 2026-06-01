"use client";

import React, { useState, useEffect } from "react";
import { CaptainJoinForm } from "@/components/groups/CaptainJoinForm";

interface GroupData {
  id: string;
  name: string;
  description?: string;
  coupleImageUrl?: string | null;
  createdAt: string;
  inviterName?: string | null;
}

interface GroupJoinPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupJoinPage({ params }: GroupJoinPageProps) {
  const [groupId, setGroupId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<GroupData | null>(null);

  // Extract group ID from params
  useEffect(() => {
    params.then(({ id }) => setGroupId(id));
  }, [params]);

  // Read the captain invite token from the URL.
  // Reason: this URL is shared by Maria (the organizer); the token validates
  // both that the visit was sanctioned and limits abuse (expiry + max uses).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setToken(t.trim());
  }, []);

  // Verify group exists when group ID is available
  useEffect(() => {
    if (groupId) {
      verifyGroup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const verifyGroup = async () => {
    if (!groupId) return;
    try {
      setVerifying(true);
      setError(null);

      const response = await fetch(`/api/v1/groups/${groupId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Group not found");
        return;
      }

      setGroupData(data.data);
    } catch (err) {
      console.error("Error verifying group:", err);
      setError("Failed to load group information");
    } finally {
      setVerifying(false);
    }
  };

  // Missing-token state — show an inline error in the same visual frame as the
  // form. Old URLs that used `?inviter_id=` (no token) land here.
  const tokenMissing = !verifying && !error && !token;
  const verifyError = error || (tokenMissing
    ? "This invite link is no longer valid. Ask the organizer for a new link."
    : null);
  const errorTitle = tokenMissing ? "Invite link expired" : "Group Not Found";

  return (
    <CaptainJoinForm
      groupId={groupId}
      token={token}
      groupData={
        groupData && !tokenMissing
          ? {
              id: groupData.id,
              name: groupData.name,
              description: groupData.description,
            }
          : null
      }
      coupleImageUrl={groupData?.coupleImageUrl || null}
      senderName={groupData?.inviterName || null}
      verifying={verifying}
      verifyMessage="Loading cookbook information..."
      verifyError={verifyError}
      errorTitle={errorTitle}
    />
  );
}
