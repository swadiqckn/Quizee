'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, User, Lock, ArrowRight, Sparkles, CheckCircle2, AlertCircle, Shield, Building2 } from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useQuizPlatform();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      if (res.user?.role === 'admin' || res.user?.role === 'superadmin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/explore');
      }
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = async (role: 'admin' | 'participant' = 'participant') => {
    const res = await loginWithGoogle(role);
    if (res.success) {
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/explore');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
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
          <h1 className="text-2xl font-black text-slate-900">Sign In to Quizee</h1>
          <p className="text-xs text-slate-500">
            Sign in with Google or your username & password credentials.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
          {/* Google Auth Option */}
          <div className="space-y-3">
            <button
              onClick={() => handleGoogleLogin('participant')}
              type="button"
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-bold text-xs shadow-sm transition flex items-center justify-center gap-2.5 hover:scale-[1.01]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleGoogleLogin('admin')}
              type="button"
              className="w-full py-2.5 px-4 rounded-2xl bg-[#fff0ea] hover:bg-[#ffe5dc] border border-[#ffd8cb] text-[#c2411d] font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-[#e05a38]" />
              <span>Organizer / Admin Sign In (Google)</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#ebdcd1] w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Or Username Login
            </span>
            <div className="border-t border-[#ebdcd1] w-full"></div>
          </div>

          {/* Username & Password Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. alexchen, sarah_j"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition flex items-center justify-center gap-2"
            >
              <span>Sign In with Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Want to host competitions?{' '}
            <Link href="/register" className="text-[#e05a38] hover:underline font-bold">
              Register Organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
