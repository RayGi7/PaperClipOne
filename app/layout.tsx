import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DJ Booking — Book Your Event',
  description: 'Book the DJ for your next event — weddings, parties, corporate events and more.',
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
