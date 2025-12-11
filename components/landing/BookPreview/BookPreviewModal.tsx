"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Book from "./Book";
import BookDetailsModal from "../BookDetailsModal";

interface BookPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookPreviewModal({
  isOpen,
  onClose,
}: BookPreviewModalProps) {
  const router = useRouter();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleCreateCookbook = () => {
    router.push("/onboarding");
  };

  const handleViewProductDetails = () => {
    onClose(); // Close preview modal
    setIsDetailsModalOpen(true); // Open details modal
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="font-serif text-2xl md:text-3xl font-medium text-[#2D2D2D]">
            Your people. Your recipes. One book.
          </DialogTitle>
        </DialogHeader>

        {/* Book Preview Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-4 gap-2 sm:gap-3">
          {/* Book Component - Perfectly Centered */}
          <div className="flex-shrink-0 flex justify-center items-center w-full max-w-full overflow-visible">
            <Book />
          </div>

          {/* Elegant tagline */}
          <div className="text-center mt-6 mb-2">
            <p className="font-serif text-lg md:text-xl text-[#2D2D2D] italic font-light">
              Made by the people who love you
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
                onClick={handleViewProductDetails}
              className="px-6 py-3 bg-white text-[#2D2D2D] border border-[#E8E0D5] rounded-xl hover:bg-[#FAF7F2] transition-colors font-medium font-sans"
            >
              See Inside
            </button>
            <button
                onClick={handleCreateCookbook}
              className="px-6 py-3 bg-[#D4A854] text-white rounded-xl hover:bg-[#c49b4a] transition-colors font-medium font-sans"
            >
              Start Your Book
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      {/* Book Details Modal */}
      <BookDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </>
  );
}
