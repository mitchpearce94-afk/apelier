import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Apelier — Shoot. Edit. Deliver.',
    template: '%s | Apelier',
  },
  description: 'The all-in-one photography business platform. CRM, AI editing, and client galleries — from shutter click to delivery in under 1 hour.',
  keywords: ['photography CRM', 'AI photo editing', 'photographer business software', 'client galleries', 'photography management'],
  openGraph: {
    title: 'Apelier — Shoot. Edit. Deliver.',
    description: 'The all-in-one photography business platform. CRM, AI editing, and client galleries.',
    siteName: 'Apelier',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Manrope:wght@200;300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
