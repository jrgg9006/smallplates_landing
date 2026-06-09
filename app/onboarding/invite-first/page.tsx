"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Check, MessageCircle, Mail, QrCode, Download } from "lucide-react";
import QRCode from "qrcode";

function InviteFirstContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const [copied, setCopied] = useState(false);
  const [collectionLink, setCollectionLink] = useState("");
  const [coupleName, setCoupleName] = useState("");
  const [occasion, setOccasion] = useState<string | null>(null);
  const [namesArePeople, setNamesArePeople] = useState(false);
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
  const [previewTab, setPreviewTab] = useState<"whatsapp" | "sms" | "guest">("whatsapp");
  const [activeShare, setActiveShare] = useState<"none" | "email" | "qr">("none");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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

    // Fetch the book name (single source of truth for the title), occasion + image
    supabase
      .from("groups")
      .select("name, occasion, couple_first_name, partner_first_name, couple_image_url")
      .eq("id", groupId)
      .single()
      .then(({ data }) => {
        if (data?.name) setCoupleName(data.name);
        setOccasion(data?.occasion ?? null);
        // Reason: people's names allow a possessive ("Maria's cookbook"); a book
        // title ("Grandma's recipes") doesn't, so the copy drops the possessive.
        setNamesArePeople(Boolean(data?.couple_first_name || data?.partner_first_name));
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

  // Reason: generate the QR lazily when the QR sub-view opens (qrcode dep is
  // already used by ShareCollectionModal — no new dependency).
  useEffect(() => {
    if (activeShare !== "qr" || !collectionLink) return;
    let cancelled = false;
    QRCode.toDataURL(collectionLink, {
      width: 600,
      margin: 2,
      color: { dark: "#2D2D2D", light: "#FFFFFF" },
    }).then((url) => { if (!cancelled) setQrDataUrl(url); }).catch(() => {});
    return () => { cancelled = true; };
  }, [activeShare, collectionLink]);

  function handleDownloadQR() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "small-plates-recipe-qr.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Reason: occasion-aware labels (same rule as the collect page). Weddings/bridal
  // showers keep "WEDDING COOKBOOK"; everything else is just "COOKBOOK". Legacy
  // groups with no occasion but real couple names are still treated as weddings.
  const isWeddingOccasion = occasion === "wedding" || occasion === "bridal_shower";
  const treatAsWedding = isWeddingOccasion || (!occasion && namesArePeople);
  const cookbookEyebrow = treatAsWedding ? "WEDDING COOKBOOK" : "COOKBOOK";

  // Reason: this modal is a 1:1 preview of the real invite, so it mirrors
  // invitationEmail1 + occasionCopy (lib/email/invitation-templates) and the
  // From display name from send-invitation-email exactly. Weddings/bridal showers
  // (and legacy no-occasion) say "A wedding cookbook gift for"; anniversary +
  // non-couple occasions use the neutral "A cookbook gift". Couples keep the
  // possessive subject; non-couple occasions drop it. Name fallback is "The Couple"
  // to match the sent email (groups.name is set in real sends).
  const emailIsWedding = !occasion || isWeddingOccasion;
  const emailIsCouple = emailIsWedding || occasion === "anniversary";
  const emailName = coupleName || "The Couple";
  const emailSubject = emailIsCouple
    ? `Your recipe goes in ${emailName}'s cookbook`
    : `Your recipe goes in ${emailName}`;
  const emailHeroLabel = emailIsWedding ? "A wedding cookbook gift for" : "A cookbook gift";

  const previewMessage = shareMessage || (coupleName
    ? (namesArePeople
        ? `You're adding a recipe to ${coupleName}'s cookbook. Doesn't have to be fancy — just something you actually make.`
        : `You're adding a recipe to this cookbook. Doesn't have to be fancy — just something you actually make.`)
    : "");

  const shortLink = collectionLink
    ? collectionLink.replace(/^https?:\/\//, "").split("?")[0]
    : "smallplatesandcompany.com/collect/...";

  const messagePreview = previewMessage ? (
    <div className="w-full max-w-sm">
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
        <button
          onClick={() => setPreviewTab("guest")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            previewTab === "guest"
              ? "bg-gray-100 text-gray-700"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Guest view
        </button>
      </div>

      {/* WhatsApp preview */}
      {previewTab === "whatsapp" && (
        <div className="bg-[#ECE5DD] rounded-2xl p-4 min-h-[240px] flex items-end">
          <div className="max-w-[88%] ml-auto">
            <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none shadow-sm overflow-hidden">
              <img
                src={coupleImageUrl || "/images/onboarding/onboarding_lemon.png"}
                alt="Preview"
                className="w-full h-32 object-cover"
              />
              <div className="p-2.5">
                <p className="text-[12px] font-medium text-gray-900 leading-tight">Share a Recipe to my Cookbook - SP&amp;Co</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{coupleName} invites you to share your favorite recipe with them!</p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">🔗</span>
                    <span className="text-[10px] text-gray-400">smallplatesandcompany.com</span>
                  </div>
                  <span className="text-[10px] text-gray-500">9:42 AM ✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS preview */}
      {previewTab === "sms" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 min-h-[240px] flex flex-col justify-end">
          <p className="text-[10px] text-gray-400 text-center mb-3">Today 9:42 AM</p>
          <div className="max-w-[85%] ml-auto">
            <div className="rounded-2xl rounded-br-sm overflow-hidden border border-gray-200">
              <img
                src={coupleImageUrl || "/images/onboarding/onboarding_lemon.png"}
                alt="Preview"
                className="w-full h-28 object-cover"
              />
              <div className="bg-gray-100 p-2.5">
                <p className="text-[12px] font-medium text-gray-900 leading-tight">Share a Recipe to my Cookbook - SP&amp;Co</p>
                <p className="text-[10px] text-gray-400 mt-0.5">smallplatesandcompany.com</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-right mt-0.5">Delivered</p>
          </div>
        </div>
      )}
      {/* Guest view preview */}
      {previewTab === "guest" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-[280px] mx-auto">
          {/* Logo */}
          <div className="py-3 flex items-center justify-center bg-white">
            <img
              src="/images/SmallPlates_logo_horizontal1.png"
              alt="Small Plates & Co."
              className="h-3"
            />
          </div>

          {/* Hero image */}
          <div className="relative">
            <img
              src={coupleImageUrl || "/images/onboarding/onboarding_lemon.png"}
              alt={coupleName}
              className="w-full h-[170px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-12">
              <p className="text-[6px] tracking-[2px] uppercase text-white/60 mb-0.5">{cookbookEyebrow}</p>
              <p className="font-serif text-[16px] text-white font-medium leading-tight">{coupleName || "your cookbook"}</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <p className="text-[9px] text-gray-600 leading-relaxed mb-3">{previewMessage}</p>
            <p className="text-[9px] text-gray-400 mb-3">Add yours by June 18th.</p>
            <div className="border border-gray-200 rounded-full px-3 py-2 mb-3 text-center">
              <p className="text-[8px] text-gray-800 font-medium">The book is filling up. Add yours now!</p>
            </div>
            <p className="text-[8px] text-gray-400 mb-3">Find your name. Add your recipe. Done.</p>

            {/* Inputs row */}
            <div className="flex gap-1.5 items-end">
              <div className="w-[60px]">
                <p className="text-[7px] font-medium text-gray-900 mb-0.5">First initial</p>
                <div className="border border-gray-300 rounded h-[22px]"></div>
              </div>
              <div className="flex-1">
                <p className="text-[7px] font-medium text-gray-900 mb-0.5">Last name</p>
                <div className="border border-gray-300 rounded h-[22px]"></div>
              </div>
              <div className="shrink-0">
                <div className="bg-gray-300 text-white text-[7px] font-medium px-2 py-[5px] rounded">
                  Search
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : <div />;

  return (
    <OnboardingShell
      title="Invite people to send recipes"
      imageUrl=""
      rightContent={messagePreview}
      backHref={`/onboarding/personalize-invite?groupId=${groupId}`}
      onContinue={() => router.push("/profile/groups")}
      continueLabel="Go to dashboard"
    >
      <div className="max-w-xl">
        <p className="text-base text-gray-600 leading-relaxed mb-6">
          Send this link to everyone you want in the cookbook. They&apos;ll get a simple form to share their recipe.
        </p>

        {/* Copy link — pill (matches ShareCollectionModal) */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-1 py-1">
          <input
            type="text"
            value={collectionLink}
            readOnly
            onFocus={(e) => e.target.select()}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate min-w-0"
          />
          <button
            onClick={handleCopy}
            disabled={!collectionLink}
            className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              copied
                ? "bg-[hsl(var(--brand-honey))] text-black"
                : "bg-brand-charcoal text-white hover:bg-gray-800"
            }`}
          >
            {copied ? (
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4" />Copied</span>
            ) : (
              "Copy link"
            )}
          </button>
        </div>

        {/* Quick share row — WhatsApp / Email / QR */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
            <span className="text-xs text-gray-700 font-medium">WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => setActiveShare(activeShare === "email" ? "none" : "email")}
            className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
              activeShare === "email" ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
          >
            <Mail className="w-6 h-6 text-gray-700" />
            <span className="text-xs text-gray-700 font-medium">Email</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveShare(activeShare === "qr" ? "none" : "qr")}
            className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
              activeShare === "qr" ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
          >
            <QrCode className="w-6 h-6 text-gray-700" />
            <span className="text-xs text-gray-700 font-medium">QR Code</span>
          </button>
        </div>

        {/* Email sub-view — we send the invite for them */}
        {activeShare === "email" && (
          <div className="mt-5 pt-5 border-t border-[hsl(var(--brand-sand))]">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">We&apos;ll send the invite for you</p>
              <button
                type="button"
                onClick={() => setShowEmailPreview(true)}
                className="text-[13px] text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                Preview invite email
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
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
                className="btn btn-sm btn-outline shrink-0 w-full sm:w-auto"
              >
                {emailSending ? "Sending..." : emailSent ? (
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Sent!</span>
                ) : "Send"}
              </button>
            </div>
            {emailError && <p className="text-sm text-red-600 mt-2">{emailError}</p>}
          </div>
        )}

        {/* QR sub-view */}
        {activeShare === "qr" && (
          <div className="mt-5 pt-5 border-t border-[hsl(var(--brand-sand))] flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500 text-center max-w-xs">
              Print this for your event. Guests scan it with their phone and add a recipe right there.
            </p>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={qrDataUrl} alt="Recipe collection QR code" className="w-40 h-40" />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-gray-400 text-sm">Generating…</div>
              )}
            </div>
            <button
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="btn btn-sm btn-outline inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download QR
            </button>
          </div>
        )}

        {/* Email preview modal */}
        {showEmailPreview && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" onClick={() => setShowEmailPreview(false)}>
            <div className="bg-white rounded-none sm:rounded-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              {/* Email header */}
              <div className="px-8 pt-6 pb-4 border-b border-gray-100">
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-14 shrink-0">From:</span>
                    <span className="text-gray-700">{emailName}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-14 shrink-0">To:</span>
                    <span className="text-gray-500 italic">recipient@email.com</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-14 shrink-0">Subject:</span>
                    <span className="text-gray-700">{emailSubject}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 pt-6 pb-8">
              {/* Hero */}
              <div className="text-center mb-6">
                <p className="text-[11px] tracking-[3px] uppercase text-gray-400 mb-2">
                  {emailHeroLabel}
                </p>
                <h2 className="font-serif text-3xl font-normal text-gray-900 mb-3">
                  {emailName}
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
