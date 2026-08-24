import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QuizPlatformProvider } from '@/lib/context';
import { Navbar } from '@/components/shared/Navbar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#e05a38',
};

export const metadata: Metadata = {
  title: 'Quizee - Live Assessment & Tournament Platform',
  description: 'Multi-tenant quiz and tournament platform for schools, universities, academies, and tech competitions.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Quizee',
  },
  icons: {
    icon: '/icons/icon.svg',
    shortcut: '/icons/icon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full select-none">
      <body className="min-h-screen flex flex-col text-slate-900 antialiased overscroll-none pb-[env(safe-area-inset-bottom)]">
        <QuizPlatformProvider>
          <Navbar />
          <main className="flex-1 pb-16 sm:pb-8">{children}</main>
        </QuizPlatformProvider>
      </body>
    </html>
  );
}
