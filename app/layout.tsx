import type { Metadata } from 'next';
import './globals.css';
import { QuizPlatformProvider } from '@/lib/context';
import { Navbar } from '@/components/shared/Navbar';

export const metadata: Metadata = {
  title: 'Quizee - Multi-Tenant MCQ & Tournament Platform',
  description: 'Enterprise multi-tenant quiz platform with dynamic time-decay scoring, multi-round tournament progression, and referral incentives.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <QuizPlatformProvider>
          <Navbar />
          <main className="flex-1 pb-16">{children}</main>
        </QuizPlatformProvider>
      </body>
    </html>
  );
}
