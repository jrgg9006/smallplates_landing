"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { updateGroupShareMessage } from "@/lib/supabase/groups";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Upload, X } from "lucide-react";

function PersonalizeInviteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");

  const [message, setMessage] = useState("");
  const [messageLoaded, setMessageLoaded] = useState(false);

  useEffect(() => {
    if (!groupId || messageLoaded) return;
    const supabase = createSupabaseClient();
    supabase
      .from("groups")
      .select("couple_first_name, partner_first_name, couple_image_url")
      .eq("id", groupId)
      .single()
      .then(({ data }) => {
        const couple = data?.couple_first_name && data?.partner_first_name
          ? `${data.couple_first_name} & ${data.partner_first_name}`
          : "the couple";
        setMessage(
          `You're adding a recipe to ${couple}'s cookbook. Doesn't have to be fancy — just something you actually make.`
        );
        if (data?.couple_image_url) {
          setPhotoPreview(data.couple_image_url);
        }
        setMessageLoaded(true);
      });
  }, [groupId, messageLoaded]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextHref = `/onboarding/invite-first?groupId=${groupId}`;

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleContinue() {
    if (!groupId) return;
    setSubmitting(true);
    setError("");

    try {
      if (message.trim()) {
        await updateGroupShareMessage(groupId, message.trim(), "");
      }

      if (photo) {
        const formData = new FormData();
        formData.append("image", photo);
        await fetch(`/api/v1/groups/${groupId}/couple-image`, {
          method: "POST",
          body: formData,
        });
      }

      router.push(nextHref);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const photoPanel = (
    <div className="flex flex-col items-center gap-3">
      {photoPreview ? (
        <div className="relative">
          <img
            src={photoPreview}
            alt="Couple"
            className="w-72 h-72 object-cover rounded-2xl border border-[hsl(var(--brand-sand))] shadow-sm"
          />
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-40 h-40 sm:w-52 sm:h-52 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[hsl(var(--brand-sand))] rounded-2xl text-gray-400 hover:border-[hsl(var(--brand-honey))] hover:text-gray-500 transition-colors"
        >
          <Upload className="w-6 h-6" />
          <span className="text-sm">Upload a photo<br /><span className="text-xs">of the couple</span></span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />
    </div>
  );

  return (
    <OnboardingShell
      title="Personalize your link"
      subtitle="Share this link via WhatsApp, text, or email to collect recipes. A short message and a photo make it feel personal."
      imageUrl=""
      skipHref={nextHref}
      backHref={`/onboarding/co-organizer?groupId=${groupId}`}
      onContinue={handleContinue}
      continueDisabled={submitting}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start max-w-2xl">
        <div>
          <label className="input-label">Your message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={280}
            className="input-field resize-none"
          />
          <p className="text-[12px] text-gray-400 mt-1">{message.length}/280</p>
        </div>

        <div>
          <label className="input-label">Photo (optional)</label>
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Couple"
                className="w-56 h-56 object-cover rounded-xl border border-[hsl(var(--brand-sand))] shadow-sm"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-44 h-44 flex flex-col items-center justify-center gap-2 border border-dashed border-[hsl(var(--brand-sand))] rounded-xl text-gray-400 hover:border-[hsl(var(--brand-honey))] hover:text-gray-500 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs text-center">Upload a photo<br />of the couple</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {error && <p className="text-sm text-red-600 col-span-full">{error}</p>}
      </div>
    </OnboardingShell>
  );
}

export default function PersonalizeInvitePage() {
  return (
    <Suspense>
      <PersonalizeInviteContent />
    </Suspense>
  );
}
