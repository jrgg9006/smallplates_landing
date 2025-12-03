"use client";

import { forwardRef } from "react";
import Image from "next/image";

interface ImagePageProps {
  imagePath: string;
  alt: string;
  pageNumber?: number;
}

const ImagePage = forwardRef<HTMLDivElement, ImagePageProps>(
  ({ imagePath, alt, pageNumber }, ref) => {
    return (
      <div 
        className="page image-page" 
        ref={ref}
        role="img"
        aria-label={alt}
      >
        <Image
          src={imagePath}
          alt={alt}
          fill
          className="page-image-full"
          style={{ objectFit: "contain" }}
          priority={false}
        />
      </div>
    );
  }
);

ImagePage.displayName = "ImagePage";

export default ImagePage;

