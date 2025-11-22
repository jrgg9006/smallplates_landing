"use client";

import { forwardRef } from "react";
import Image from "next/image";

interface BookCoverProps {
  isBackCover?: boolean;
}

const BookCover = forwardRef<HTMLDivElement, BookCoverProps>(
  ({ isBackCover = false }, ref) => {
    if (isBackCover) {
      return (
        <div 
          className="cover cover-back" 
          ref={ref} 
          data-density="hard"
          role="img"
          aria-label="Back cover"
        >
          <Image
            src="/images/BookPreview/book-cover-back.png"
            alt="Back cover"
            fill
            className="cover-image-full"
            style={{ objectFit: "cover" }}
            priority={false}
          />
        </div>
      );
    }

    return (
      <div 
        className="cover cover-front" 
        ref={ref} 
        data-density="hard"
        role="img"
        aria-label="Front cover of Family Recipe Cookbook"
      >
        <Image
          src="/images/BookPreview/book-cover-front.png"
          alt="Front cover of Family Recipe Cookbook"
          fill
          className="cover-image-full"
          style={{ objectFit: "cover" }}
          priority={true}
        />
      </div>
    );
  }
);

BookCover.displayName = "BookCover";

export default BookCover;

