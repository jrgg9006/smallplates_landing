// Dynamic metadata will be generated in page.tsx

export default function CollectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <head>
        {/* Additional WhatsApp and sharing optimization meta tags */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="canonical" href="https://smallplatesandcompany.com/collect" />
      </head>
      {children}
    </>
  )
}