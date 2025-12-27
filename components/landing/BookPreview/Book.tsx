"use client";

import { useEffect, useState, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import BookCover from "./BookCover";
import ImagePage from "./ImagePage";
import "./Book.css";

// Array of page images in order - all 26 pages
const bookPages = [
  { imagePath: "/images/BookPreview/book-page-1.png", alt: "Page 1" },
  { imagePath: "/images/BookPreview/book-page-2.png", alt: "Page 2" },
  { imagePath: "/images/BookPreview/book-page-3.png", alt: "Page 3" },
  { imagePath: "/images/BookPreview/book-page-4.png", alt: "Page 4" },
  { imagePath: "/images/BookPreview/book-page-5.png", alt: "Page 5" },
  { imagePath: "/images/BookPreview/book-page-6.png", alt: "Page 6" },
  { imagePath: "/images/BookPreview/book-page-7.png", alt: "Page 7" },
  { imagePath: "/images/BookPreview/book-page-8.png", alt: "Page 8" },
  { imagePath: "/images/BookPreview/book-page-9.png", alt: "Page 9" },
  { imagePath: "/images/BookPreview/book-page-10.png", alt: "Page 10" },
  { imagePath: "/images/BookPreview/book-page-11.png", alt: "Page 11" },
  { imagePath: "/images/BookPreview/book-page-12.png", alt: "Page 12" },
  { imagePath: "/images/BookPreview/book-page-13.png", alt: "Page 13" },
  { imagePath: "/images/BookPreview/book-page-14.png", alt: "Page 14" },
  { imagePath: "/images/BookPreview/book-page-15.png", alt: "Page 15" },
  { imagePath: "/images/BookPreview/book-page-16.png", alt: "Page 16" },
  { imagePath: "/images/BookPreview/book-page-17.png", alt: "Page 17" },
  { imagePath: "/images/BookPreview/book-page-18.png", alt: "Page 18" },
  { imagePath: "/images/BookPreview/book-page-19.png", alt: "Page 19" },
  { imagePath: "/images/BookPreview/book-page-20.png", alt: "Page 20" },
  { imagePath: "/images/BookPreview/book-page-21.png", alt: "Page 21" },
  { imagePath: "/images/BookPreview/book-page-22.png", alt: "Page 22" },
  { imagePath: "/images/BookPreview/book-page-23.png", alt: "Page 23" },
  { imagePath: "/images/BookPreview/book-page-24.png", alt: "Page 24" },
  { imagePath: "/images/BookPreview/book-page-25.png", alt: "Page 25" },
  { imagePath: "/images/BookPreview/book-page-26.png", alt: "Page 26" },
];

export default function Book() {
  // Smaller sizes to fit in modal - maintain 6:9 aspect ratio
  const [bookSize, setBookSize] = useState({ width: 250, height: 375 });
  const flipBookRef = useRef<any>(null);

  // Calculate total pages: 1 front cover + 26 content pages + 1 back cover = 28 pages total
  const totalPages = 1 + bookPages.length + 1; // Front cover + content + back cover

  // Maintain 6:9 aspect ratio (2:3) for all screen sizes
  // Note: Width is per page, when open it shows 2 pages side by side
  useEffect(() => {
    const updateBookSize = () => {
      if (typeof window === "undefined") return;

      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      // Calculate available height: modal height minus header, details panel, buttons, padding
      // Modal is 90vh, header ~80px, details ~120px, buttons ~60px, padding ~40px = ~300px overhead
      const availableHeight = containerHeight * 0.9 - 300;
      const maxBookHeight = Math.min(availableHeight, 400); // Cap at 400px
      
      let width = 250;
      let height = 375;

      // Consider both width and height for better responsiveness
      if (containerWidth < 768) {
        // Mobile
        width = 180;
        height = 270; // Maintains 6:9 ratio
      } else if (containerWidth < 1024) {
        // Tablet
        width = 220;
        height = 330; // Maintains 6:9 ratio
      } else if (containerHeight < 900 || containerWidth < 1440) {
        // Laptop screens (smaller height or medium width)
        width = 200;
        height = 300; // Maintains 6:9 ratio - smaller for laptops
      } else {
        // Large desktop screens
        width = 250;
        height = 375;
      }

      // Ensure book doesn't exceed available height
      if (height > maxBookHeight) {
        const scale = maxBookHeight / height;
        height = maxBookHeight;
        width = width * scale;
      }

      setBookSize({ width, height });
    };

    updateBookSize();
    window.addEventListener("resize", updateBookSize);

    return () => window.removeEventListener("resize", updateBookSize);
  }, []);

  // Initialize the book after mount to ensure proper setup
  useEffect(() => {
    if (flipBookRef.current && flipBookRef.current.pageFlip) {
      const pageFlip = flipBookRef.current.pageFlip();
      const lastPageIndex = totalPages - 1;
      
      // Set boundaries to prevent wrapping
      if (pageFlip && typeof pageFlip.setPage === 'function') {
        // Ensure we start at page 0
        pageFlip.flip(0, 'forward');
      }
    }
  }, [totalPages]);

  // Handle page flip - prevent going past the last page or before the first
  const handleFlip = (e: any) => {
    if (!e || flipBookRef.current === null) return;
    
    const currentPage = e.data !== undefined ? e.data : e;
    const lastPageIndex = totalPages - 1;
    
    // If trying to go past the last page, prevent it
    if (currentPage > lastPageIndex) {
      requestAnimationFrame(() => {
        if (flipBookRef.current?.pageFlip) {
          try {
            flipBookRef.current.pageFlip().flip(lastPageIndex, 'back');
          } catch (err) {
            // console.log removed for production
          }
        }
      });
    }
    // If trying to go before the first page, prevent it
    if (currentPage < 0) {
      requestAnimationFrame(() => {
        if (flipBookRef.current?.pageFlip) {
          try {
            flipBookRef.current.pageFlip().flip(0, 'forward');
          } catch (err) {
            // console.log removed for production
          }
        }
      });
    }
  };

  // Handle book initialization
  const handleFlipInit = (e: any) => {
    if (flipBookRef.current && flipBookRef.current.pageFlip) {
      const pageFlip = flipBookRef.current.pageFlip();
      // Ensure we start at the first page
      if (pageFlip && typeof pageFlip.flip === 'function') {
        pageFlip.flip(0, 'forward');
      }
    }
  };

  return (
    <div className="book-container" role="region" aria-label="Cookbook preview">
      <HTMLFlipBook
        ref={flipBookRef}
        width={bookSize.width}
        height={bookSize.height}
        showCover={true}
        maxShadowOpacity={0.5}
        mobileScrollSupport={true}
        useMouseEvents={true}
        className="cookbook-flipbook"
        aria-label="Interactive cookbook preview - click or tap pages to flip, swipe on mobile"
        drawShadow={true}
        flippingTime={800}
        startPage={0}
        size="fixed"
        onFlip={handleFlip}
        onFlipInit={handleFlipInit}
        {...({} as any)}
      >
        {/* Front Cover */}
        <BookCover key="front-cover" />

        {/* Book Pages 1-26 */}
        {bookPages.map((page, index) => (
          <ImagePage
            key={`page-${page.imagePath}`}
            imagePath={page.imagePath}
            alt={page.alt}
            pageNumber={index + 1}
          />
        ))}

        {/* Back Cover */}
        <BookCover key="back-cover" isBackCover={true} />
      </HTMLFlipBook>
      <p className="tap-to-flip-hint" aria-live="polite">
        Tap to flip pages
      </p>
    </div>
  );
}

