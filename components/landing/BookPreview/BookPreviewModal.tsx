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
          <DialogTitle className="font-serif text-2xl font-semibold">
            The Small Plates Cookbook
          </DialogTitle>
        </DialogHeader>

        {/* Book Preview Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-4 gap-2 sm:gap-3">
          {/* Book Component - Perfectly Centered */}
          <div className="flex-shrink-0 flex justify-center items-center w-full max-w-full overflow-visible">
            <Book />
          </div>

          {/* Book Details Panel */}
            <div className="bg-gray-50 rounded-lg px-4 py-3 w-full max-w-2xl border border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 text-normal md:text-normal leading-relaxed font-light">
                      Loved by hundreds of customers
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 text-normal md:text-normal leading-relaxed font-light">
                      Fully customizable with your recipes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
                onClick={handleViewProductDetails}
              className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View product details
            </button>
            <button
                onClick={handleCreateCookbook}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Create your Cookbook
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
