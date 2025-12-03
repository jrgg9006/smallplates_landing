"use client";

import { forwardRef } from "react";
import Image from "next/image";
import type { TableOfContentsData } from "@/lib/data/cookbookPreviewData";

interface TableOfContentsPageProps {
  tocData: TableOfContentsData;
  isLeftPage?: boolean;
}

const TableOfContentsPage = forwardRef<HTMLDivElement, TableOfContentsPageProps>(
  ({ tocData, isLeftPage = true }, ref) => {
    if (isLeftPage) {
      return (
        <div className="page toc-page" ref={ref}>
          <div className="page-content toc-content">
            <h2 className="toc-title">table of contents</h2>
            
            <div className="toc-section">
              <h3 className="toc-section-title">breakfast</h3>
              <div className="toc-items">
                {tocData.left.breakfast.map((item, index) => (
                  <div key={index} className="toc-item">
                    <div className="toc-item-image-circle">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="toc-thumbnail"
                      />
                    </div>
                    <span className="toc-item-name">{item.name}</span>
                    <span className="toc-item-page">page {item.pageNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="toc-section">
              <h3 className="toc-section-title">sides</h3>
              <div className="toc-items">
                {tocData.left.sides.map((item, index) => (
                  <div key={index} className="toc-item">
                    <div className="toc-item-image-circle">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="toc-thumbnail"
                      />
                    </div>
                    <span className="toc-item-name">{item.name}</span>
                    <span className="toc-item-page">page {item.pageNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="toc-section">
              <h3 className="toc-section-title">lunch dishes</h3>
              <div className="toc-items">
                {tocData.left.lunch.map((item, index) => (
                  <div key={index} className="toc-item">
                    <div className="toc-item-image-circle">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="toc-thumbnail"
                      />
                    </div>
                    <span className="toc-item-name">{item.name}</span>
                    <span className="toc-item-page">page {item.pageNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Right page
    return (
      <div className="page toc-page" ref={ref}>
        <div className="page-content toc-content">
          <div className="toc-section toc-section-right">
            <h3 className="toc-section-title">main dishes</h3>
            <div className="toc-items toc-items-large">
              {tocData.right.mainDishes.map((item, index) => (
                <div key={index} className="toc-item toc-item-large">
                  <div className="toc-item-image-rect">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={80}
                      className="toc-image-large"
                    />
                  </div>
                  <span className="toc-item-name">{item.name}</span>
                  <span className="toc-item-page">page {item.pageNumber}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="toc-section toc-section-right">
            <h3 className="toc-section-title">desserts</h3>
            <div className="toc-items toc-items-large">
              {tocData.right.desserts.map((item, index) => (
                <div key={index} className="toc-item toc-item-large">
                  <div className="toc-item-image-rect">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={80}
                      className="toc-image-large"
                    />
                  </div>
                  <span className="toc-item-name">{item.name}</span>
                  <span className="toc-item-page">page {item.pageNumber}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TableOfContentsPage.displayName = "TableOfContentsPage";

export default TableOfContentsPage;

