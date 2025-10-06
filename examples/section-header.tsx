import * as React from "react";

export default function SectionHeader() {
  return (
    <header
      role="banner"
      aria-label="Top banner"
      className="w-full bg-white border-b border-gray-100"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-center">
        <img
          src="/images/logo.svg"
          alt="Small Plates & Company"
          className="h-8 w-auto"
        />
      </div>
    </header>
  );
}
