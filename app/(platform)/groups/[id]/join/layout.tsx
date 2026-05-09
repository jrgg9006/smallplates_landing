import type { Metadata } from 'next';

// Reason: WhatsApp/iMessage preview when sharing the "captain invite" link.
// Lives here (not in root layout) so it applies ONLY to /groups/[id]/join
// and never affects /collect/[token], which has its own per-couple
// generateMetadata that surfaces the couple image.
export const metadata: Metadata = {
  title: 'Captain a cookbook',
  description: 'Help bring in recipes from everyone. We design and print the book.',
  openGraph: {
    title: 'Captain a cookbook',
    description: 'Help bring in recipes from everyone. We design and print the book.',
    images: [
      {
        url: '/images/2SmallPlates-verticallogowhiteback.png',
        width: 500,
        height: 500,
        alt: 'Small Plates & Co.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Captain a cookbook',
    description: 'Help bring in recipes from everyone. We design and print the book.',
    images: ['/images/2SmallPlates-verticallogowhiteback.png'],
  },
};

export default function GroupJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
