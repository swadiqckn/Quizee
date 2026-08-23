import type { Metadata } from 'next';
import './globals.css';
import { QuizPlatformProvider } from '@/lib/context';
import { Navbar } from '@/components/shared/Navbar';

export const metadata: Metadata = {
  title: 'Quizee - Multi-Tenant Assessment & Tournament Platform',
  description: 'Multi-tenant quiz and tournament platform for schools, universities, academies, and tech competitions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col text-slate-900 antialiased">
        <QuizPlatformProvider>
          <Navbar />
          <main className="flex-1 pb-16">{children}</main>
        </QuizPlatformProvider>
      </body>
    </html>
  );
}
