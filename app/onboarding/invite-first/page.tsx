"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

function InviteFirstContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const [copied, setCopied] = useState(false);
  const [collectionLink, setCollectionLink] = useState("");
  const [coupleName, setCoupleName] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [coupleImageUrl, setCoupleImageUrl] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState("");

  // Invite via email state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<"whatsapp" | "sms">("whatsapp");

  useEffect(() => {
    if (!groupId) return;
    const supabase = createSupabaseClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      setInviterName(user.user_metadata?.full_name || user.user_metadata?.name || "");

      supabase
        .from("profiles")
        .select("collection_link_token")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.collection_link_token) {
            setCollectionLink(
              `${window.location.origin}/collect/${profile.collection_link_token}?group=${groupId}`
            );
          }
        });

      // Fetch custom share message
      supabase
        .from("group_members")
        .select("custom_share_message")
        .eq("group_id", groupId)
        .eq("profile_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.custom_share_message) setShareMessage(data.custom_share_message);
        });
    });

    // Fetch couple names + image
    supabase
      .from("groups")
      .select("couple_first_name, partner_first_name, couple_image_url")
      .eq("id", groupId)
      .single()
      .then(({ data }) => {
        if (data?.couple_first_name && data?.partner_first_name) {
          setCoupleName(`${data.couple_first_name} & ${data.partner_first_name}`);
        }
        if (data?.couple_image_url) setCoupleImageUrl(data.couple_image_url);
      });
  }, [groupId]);

  const whatsappText = coupleName
    ? `I'm putting together a cookbook for ${coupleName} — can you send one recipe? Takes about 5 min: ${collectionLink}`
    : `I'm putting together a cookbook — can you send one recipe? Takes about 5 min: ${collectionLink}`;

  function handleCopy() {
    navigator.clipboard.writeText(collectionLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleEmailInvite() {
    if (!guestName.trim() || !guestEmail.trim() || !groupId) return;
    setEmailSending(true);
    setEmailError("");

    try {
      const res = await fetch(`/api/v1/groups/${groupId}/invite-guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName.trim(), email: guestEmail.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setEmailError(error || "Could not send invitation");
        setEmailSending(false);
        return;
      }
      setEmailSent(true);
      setGuestName("");
      setGuestEmail("");
      setTimeout(() => setEmailSent(false), 3000);
    } catch {
      setEmailError("Something went wrong");
    }
    setEmailSending(false);
  }

  const previewMessage = shareMessage || (coupleName
    ? `You're adding a recipe to ${coupleName}'s cookbook. Doesn't have to be fancy — just something you actually make.`
    : "");

  const shortLink = collectionLink
    ? collectionLink.replace(/^https?:\/\//, "").split("?")[0]
    : "smallplatesandcompany.com/collect/...";

  const messagePreview = previewMessage ? (
    <div className="w-full max-w-xs">
      {/* Tabs */}
      <div className="flex justify-center gap-1 mb-3">
        <button
          onClick={() => setPreviewTab("whatsapp")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            previewTab === "whatsapp"
              ? "bg-[#25D366]/10 text-[#25D366]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          WhatsApp
        </button>
        <button
          onClick={() => setPreviewTab("sms")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            previewTab === "sms"
              ? "bg-blue-50 text-blue-500"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          SMS
        </button>
      </div>

      {/* WhatsApp preview */}
      {previewTab === "whatsapp" && (
        <div className="bg-[#ECE5DD] rounded-2xl p-4 min-h-[220px]">
          <div className="max-w-[85%] ml-auto">
            {coupleImageUrl && (
              <img src={coupleImageUrl} alt="Couple" className="w-full h-28 object-cover rounded-t-lg" />
            )}
            <div className={`bg-[#DCF8C6] p-3 shadow-sm ${coupleImageUrl ? "rounded-b-lg" : "rounded-lg"}`}>
              <p className="text-[13px] text-gray-800 leading-relaxed">{previewMessage}</p>
              <p className="text-[12px] text-blue-600 mt-1.5 break-all">{shortLink}</p>
              <p className="text-[10px] text-gray-500 text-right mt-1">now ✓✓</p>
            </div>
          </div>
        </div>
      )}

      {/* SMS preview */}
      {previewTab === "sms" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 min-h-[220px]">
          <div className="max-w-[85%] ml-auto">
            <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-br-sm">
              <p className="text-[13px] leading-relaxed">{previewMessage}</p>
              <p className="text-[12px] text-blue-100 mt-1.5 break-all">{shortLink}</p>
            </div>
            <p className="text-[10px] text-gray-400 text-right mt-1">Delivered</p>
          </div>
        </div>
      )}
    </div>
  ) : <div />;

  return (
    <OnboardingShell
      title="Invite people to contribute"
      imageUrl=""
      rightContent={messagePreview}
      backHref={`/onboarding/personalize-invite?groupId=${groupId}`}
      onContinue={() => router.push("/profile/groups")}
      continueLabel="Go to dashboard"
    >
      <div className="max-w-4xl">

        {/* Section 1: Copy link */}
        <div className="flex items-center justify-between pb-8 mb-8 border-b border-[hsl(var(--brand-sand))]">
          <div>
            <p className="text-base font-medium text-gray-900">Invite via link</p>
            <p className="text-sm text-gray-500">Great for sending over text or social media.</p>
          </div>
          <button
            onClick={handleCopy}
            disabled={!collectionLink}
            className="btn btn-sm btn-outline shrink-0 min-w-[160px]"
          >
            {copied ? "Copied!" : "Copy invite link"}
          </button>
        </div>

        {/* Section 2: WhatsApp */}
        <div className="flex items-center justify-between pb-8 mb-8 border-b border-[hsl(var(--brand-sand))]">
          <div>
            <p className="text-base font-medium text-gray-900">Share via WhatsApp</p>
            <p className="text-sm text-gray-500">Opens WhatsApp with a pre-written message.</p>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm shrink-0 inline-flex items-center gap-2 text-white min-w-[160px] justify-center"
            style={{ backgroundColor: "#25D366" }}
          >
            Send via WhatsApp
          </a>
        </div>

        {/* Section 3: Email */}
        <div className="pb-2 bg-[hsl(var(--brand-warm-white-warm))] -mx-5 px-5 py-5 rounded-xl">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-base font-medium text-gray-900">Invite via email</p>
            <button
              type="button"
              onClick={() => setShowEmailPreview(true)}
              className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              Preview invite email
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="input-field flex-1"
              placeholder="Name"
            />
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="input-field flex-1"
              placeholder="Email"
            />
            <button
              onClick={handleEmailInvite}
              disabled={emailSending || !guestName.trim() || !guestEmail.trim()}
              className="btn btn-sm btn-outline shrink-0"
            >
              {emailSending ? "Sending..." : emailSent ? (
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Sent!</span>
              ) : "Send"}
            </button>
          </div>
          {emailError && <p className="text-sm text-red-600 mt-2">{emailError}</p>}
        </div>

        {/* Email preview modal */}
        {showEmailPreview && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" onClick={() => setShowEmailPreview(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              {/* Email header */}
              <div className="px-8 pt-6 pb-4 border-b border-gray-100">
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-14 shrink-0">From:</span>
                    <span className="text-gray-700">{coupleName || "Small Plates & Co."}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-14 shrink-0">To:</span>
                    <span className="text-gray-500 italic">recipient@email.com</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-14 shrink-0">Subject:</span>
                    <span className="text-gray-700">Can you send a recipe for {coupleName || "the couple"}&apos;s cookbook?</span>
                  </div>
                </div>
              </div>

              <div className="px-8 pt-6 pb-8">
              {/* Hero */}
              <div className="text-center mb-6">
                <p className="text-[11px] tracking-[3px] uppercase text-gray-400 mb-2">
                  A cookbook gift for
                </p>
                <h2 className="font-serif text-3xl font-normal text-gray-900 mb-3">
                  {coupleName || "the couple"}
                </h2>
                <div className="w-12 h-px bg-brand-honey mx-auto" />
              </div>

              {/* Couple image */}
              {coupleImageUrl && (
                <div className="flex justify-center mb-6">
                  <img
                    src={coupleImageUrl}
                    alt={coupleName}
                    className="w-32 h-32 object-cover rounded-2xl"
                  />
                </div>
              )}

              {/* Body */}
              <div className="text-[15px] text-gray-600 leading-relaxed space-y-3 text-center max-w-xs mx-auto">
                <p>We&apos;re making them a cookbook. A real one. With recipes from the people who matter most to them.</p>
                <p>Send a recipe and you&apos;re in their kitchen.</p>
                <p className="font-semibold text-gray-900">Doesn&apos;t have to be fancy. Just has to be yours.</p>
              </div>

              {/* CTA */}
              <div className="text-center mt-6">
                <span className="inline-block bg-brand-charcoal text-white text-xs font-medium tracking-[2px] uppercase px-10 py-4 rounded">
                  ADD YOUR RECIPE
                </span>
                <p className="text-[13px] text-gray-400 mt-3">5 minutes. That&apos;s it.</p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  This is a preview of the email your guests will receive.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Close
              </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </OnboardingShell>
  );
}

export default function InviteFirstPage() {
  return (
    <Suspense>
      <InviteFirstContent />
    </Suspense>
  );
}
