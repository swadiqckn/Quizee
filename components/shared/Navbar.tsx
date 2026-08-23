'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Trophy,
  Compass,
  Users,
  LayoutDashboard,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronDown,
  Gift,
  Building2,
  CheckCircle,
  LogIn,
  LogOut,
  UserPlus,
  Crown,
  CreditCard,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, switchUserRole, activeOrg, organisations, setActiveOrg, logout } = useQuizPlatform();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyReferral = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const navLinks = [
    { href: '/explore', label: 'Explore Quizzes', icon: Compass },
    { href: '/admin/billing', label: 'Plans & Pricing', icon: Crown },
  ];

  if (currentUser) {
    navLinks.push({ href: '/referrals', label: 'Referrals', icon: Gift });

    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      navLinks.push({ href: '/admin/dashboard', label: 'Organizer Portal', icon: LayoutDashboard });
    }

    if (currentUser.role === 'superadmin') {
      navLinks.push({ href: '/superadmin', label: 'Superadmin', icon: ShieldCheck });
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Tenant Pill */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent font-black tracking-tight">
              Quizee
            </span>
          </Link>

          {/* Org Selector */}
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeOrg ? activeOrg.name : 'All Tenants'}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Tenant Org
                </div>
                {organisations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setActiveOrg(org);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 transition ${
                      activeOrg?.id === org.id ? 'text-indigo-400 font-semibold bg-indigo-950/30' : 'text-slate-300'
                    }`}
                  >
                    <span>{org.name}</span>
                    {activeOrg?.id === org.id && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Guest Controls */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              {/* User Points Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentUser.total_points} pts</span>
              </div>

              {/* Referral Code Quick Copy */}
              <button
                onClick={copyReferral}
                title="Click to copy your referral code"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition group"
              >
                <Gift className="w-3 h-3 text-pink-400" />
                <span>{currentUser.referral_code}</span>
                {copiedCode && <span className="text-[10px] text-emerald-400 font-sans ml-1">Copied!</span>}
              </button>

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-white transition"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[11px] font-bold text-indigo-300 font-mono">
                    {currentUser.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">@{currentUser.username}</p>
                    <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">{currentUser.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white">@{currentUser.username}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.full_name || 'Contestant'}</p>
                    </div>

                    <div className="pt-2 pb-1 text-[11px] font-semibold text-slate-500 px-3 uppercase tracking-wider">
                      Switch Active Role
                    </div>
                    {(['participant', 'admin', 'superadmin'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchUserRole(r);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                          currentUser.role === r ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <span className="capitalize">{r === 'admin' ? 'Admin (Organizer)' : r}</span>
                        {currentUser.role === r && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    ))}

                    <div className="pt-2 mt-1 border-t border-slate-800 space-y-1">
                      <button
                        onClick={() => {
                          logout();
                          setRoleDropdownOpen(false);
                          router.push('/');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                Sign In
              </Link>

              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition hover:scale-105 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                Host a Competition
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
