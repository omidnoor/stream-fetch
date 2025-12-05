"use client";

/**
 * PDFThumbnailSidebar Component
 *
 * Displays a sidebar with thumbnail previews of all PDF pages.
 * Allows quick navigation between pages.
 */

import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import PDFThumbnail from "./PDFThumbnail";
import { FileText } from "lucide-react";

interface PDFThumbnailSidebarProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  onPageSelect: (pageNum: number) => void;
  className?: string;
}

export default function PDFThumbnailSidebar({
  pdfDoc,
  currentPage,
  onPageSelect,
  className = "",
}: PDFThumbnailSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active thumbnail
  useEffect(() => {
    if (activeThumbRef.current && sidebarRef.current) {
      const sidebar = sidebarRef.current;
      const activeThumb = activeThumbRef.current;

      const sidebarRect = sidebar.getBoundingClientRect();
      const thumbRect = activeThumb.getBoundingClientRect();

      // Check if thumbnail is outside visible area
      if (
        thumbRect.top < sidebarRect.top ||
        thumbRect.bottom > sidebarRect.bottom
      ) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentPage]);

  if (!pdfDoc) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No PDF loaded</p>
        </div>
      </div>
    );
  }

  const totalPages = pdfDoc.numPages;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      ref={sidebarRef}
      className={`w-48 bg-[#0f0f0f] border-r border-gray-800 overflow-y-auto ${className}`}
    >
      <div className="p-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 sticky top-0 bg-[#0f0f0f] py-2 z-10">
          Pages ({totalPages})
        </h3>

        <div className="space-y-3">
          {pages.map((pageNum) => (
            <div
              key={pageNum}
              ref={pageNum === currentPage ? activeThumbRef : null}
            >
              <PDFThumbnail
                pageNum={pageNum}
                pdfDoc={pdfDoc}
                isActive={pageNum === currentPage}
                onClick={onPageSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
