"use client";

import React from 'react';

export default function PrintedBookStep() {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="printed-book-heading">
      <div className="text-center px-4 md:px-6">
        <h2 id="printed-book-heading" className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
          Your recipe will be printed in a real book —<br />
          write it your way, make it yours.
        </h2>
      </div>
    </div>
  );
}

