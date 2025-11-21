"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookPreviewModal({
  isOpen,
  onClose,
}: BookPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="font-serif text-2xl font-semibold">
            Family Recipe Cookbook
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Starting at $14.99 for 20 pages
          </p>
        </DialogHeader>

        {/* Book Preview Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center px-8 py-6">
          {/* Placeholder for book preview */}
          <div className="mb-4 flex justify-center items-center">
            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-12 text-center max-w-2xl">
              <p className="text-gray-500 text-lg">
                Book preview coming soon
              </p>
            </div>
          </div>

          {/* Book Details Panel */}
          <div className="bg-gray-50 rounded-lg p-6 w-full max-w-2xl border border-gray-200">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">
                    32K books created with this theme
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">
                    28 pages included
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
                  <p className="text-gray-900 text-sm font-medium">
                    100% fully customizable
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
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">
                    Order with <strong>Rush</strong> to get it by November 28
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View product details
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Start Designing
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
