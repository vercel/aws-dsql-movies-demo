import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';

export const metadata: Metadata = {
  title: 'DQL Movies Demo',
  description: 'Search movies from a globally distributed Postgres database.',
};

const geist = Geist({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  );
}
