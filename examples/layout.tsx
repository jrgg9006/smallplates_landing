import * as React from "react";

/**
 * Minimal layout skeleton showing container spacing and base SEO tags.
 * In your real app, put this in /app/layout.tsx and use Next.js Metadata.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Small Plates & Company</title>
        <meta name="description" content="A cookbook experience made with your loved ones’ recipes." />
        <meta property="og:title" content="Small Plates & Company" />
        <meta property="og:description" content="A cookbook experience made with your loved ones’ recipes." />
        <meta property="og:type" content="website" />
      </head>
      <body className="antialiased bg-white text-gray-900">
        <main className="min-h-dvh">{children}</main>
      </body>
    </html>
  );
}
