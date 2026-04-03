import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DJ Booking',
  description: 'Book the DJ for your next event',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
