'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizPlatform } from '@/lib/context';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useQuizPlatform();
  const router = useRouter();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/explore');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500">Verifying Admin Permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Admin Privileges Required</h2>
          <p className="text-xs text-slate-500 max-w-sm">
            Only organizer accounts with role <strong>admin</strong> have access to the Admin Portal. Redirecting to explore...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
