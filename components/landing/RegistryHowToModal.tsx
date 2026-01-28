"use client";

import React from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const VIMEO_EMBED_SRC =
  "https://player.vimeo.com/video/1159409853?badge=0&autopause=0&player_id=0&app_id=58479";

export default function RegistryHowToModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden bg-white">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-semibold text-gray-900">
              How to add to your registry
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-gray-600 font-light">Quick walkthrough.</p>
        </div>

        <div className="px-6 pb-6">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            {/* Only mount the iframe when open, so the landing page stays fast. */}
            {isOpen ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={VIMEO_EMBED_SRC}
                title="How to add to your registry"
                loading="lazy"
                allow="fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

