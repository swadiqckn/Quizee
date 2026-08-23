'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Shield, ArrowRight, Sparkles, Building2, CheckCircle2, Crown } from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') || undefined;
  const { loginWithGoogle } = useQuizPlatform();

  const handleAdminGoogleRegister = async () => {
    const res = await loginWithGoogle({ role: 'admin', referralCode });
    if (res.success) {
      router.push('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          {/* Logo Blocks */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm">
              Q
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm">
              u
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm">
              i
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm">
              z
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm">
              e
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm">
              e
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Create Organizer Account</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Organizers and schools authenticate securely with Google to manage tenant competitions and batches.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
          {/* Plan Highlights */}
          <div className="p-5 rounded-2xl bg-[#fff9f6] border border-[#ffd8cb] space-y-2.5">
            <div className="flex items-center gap-2 text-[#c2411d] text-xs font-black">
              <Crown className="w-4 h-4 text-[#e05a38]" />
              <span>Organizer Privileges Included</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                Free Starter Plan: Up to 100 participants per quiz
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                Multi-level tournament brackets with scheduled progression
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                Anti-cheat shuffling, live monitors & viral referral engines
              </li>
            </ul>
          </div>

          {/* Exclusive Google Registration Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAdminGoogleRegister}
              type="button"
              className="w-full py-4 px-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-black text-xs shadow-xl shadow-[#e05a38]/25 transition flex items-center justify-center gap-3 hover:scale-[1.01]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#ffffff"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#ffffff"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#ffffff"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google (Register as Admin)</span>
            </button>
          </div>

          {/* Participant Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="text-xs font-bold text-slate-800">Are you a Contestant / Student?</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Contestants do not need to register in advance. You will authenticate with Google directly when joining your competition arena.
            </p>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#e05a38] hover:underline font-bold">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-400 text-xs">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
