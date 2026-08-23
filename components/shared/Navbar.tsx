'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Trophy,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Gift,
  Building2,
  CheckCircle,
  LogIn,
  LogOut,
  Crown,
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
    { href: '/demo', label: 'Interactive Demo', icon: Sparkles },
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
    <header className="sticky top-0 z-50 w-full border-b border-[#ebdcd1] bg-[#fffaf5]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Tenant Pill */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1 group">
            {/* Tile Blocks Logo like Quizly style */}
            <div className="flex items-center gap-1">
              <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                Q
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform delay-75">
                u
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform delay-100">
                i
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform delay-150">
                z
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform delay-200">
                e
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#e05a38] text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform delay-300">
                e
              </span>
            </div>
          </Link>

          {/* Org Selector */}
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#ebdcd1] text-xs font-semibold text-slate-700 hover:text-[#e05a38] hover:border-[#e05a38]/40 shadow-sm transition"
            >
              <Building2 className="w-3.5 h-3.5 text-[#e05a38]" />
              <span>{activeOrg ? activeOrg.name : 'All Tenants'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-[#ebdcd1] shadow-xl py-1.5 z-50">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Tenant Org
                </div>
                {organisations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setActiveOrg(org);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#fff3ed] transition ${
                      activeOrg?.id === org.id ? 'text-[#e05a38] font-bold bg-[#fff0e8]' : 'text-slate-700'
                    }`}
                  >
                    <span>{org.name}</span>
                    {activeOrg?.id === org.id && <CheckCircle className="w-3.5 h-3.5 text-[#e05a38]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#ffebe3] text-[#c2411d] border border-[#fcd5c7]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[#b45309] text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentUser.total_points} pts</span>
              </div>

              {/* Referral Code Quick Copy */}
              <button
                onClick={copyReferral}
                title="Click to copy your referral code"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#ebdcd1] hover:border-[#e05a38]/50 text-slate-700 text-xs font-mono font-bold shadow-sm transition"
              >
                <Gift className="w-3.5 h-3.5 text-[#e05a38]" />
                <span>{currentUser.referral_code}</span>
                {copiedCode && <span className="text-[10px] text-emerald-600 font-sans ml-1 font-bold">Copied!</span>}
              </button>

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-[#ebdcd1] hover:border-[#e05a38]/50 text-xs font-semibold text-slate-800 shadow-sm transition"
                >
                  <div className="w-6 h-6 rounded-full bg-[#ffebe3] text-[#e05a38] flex items-center justify-center text-[11px] font-black">
                    {currentUser.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">@{currentUser.username}</p>
                    <p className="text-[10px] uppercase font-bold text-[#e05a38] tracking-wider">{currentUser.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#ebdcd1] shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-extrabold text-slate-900">@{currentUser.username}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.full_name || 'Contestant'}</p>
                    </div>

                    <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider">
                      Switch Role
                    </div>
                    {(['participant', 'admin', 'superadmin'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchUserRole(r);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-[#fff3ed] transition ${
                          currentUser.role === r ? 'bg-[#ffebe3] text-[#c2411d]' : 'text-slate-700'
                        }`}
                      >
                        <span className="capitalize">{r === 'admin' ? 'Admin (Organizer)' : r}</span>
                        {currentUser.role === r && <CheckCircle className="w-3.5 h-3.5 text-[#e05a38]" />}
                      </button>
                    ))}

                    <div className="pt-2 mt-1 border-t border-slate-100 space-y-1">
                      <button
                        onClick={() => {
                          logout();
                          setRoleDropdownOpen(false);
                          router.push('/');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
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
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-white border border-transparent hover:border-[#ebdcd1] shadow-none hover:shadow-sm transition flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                Sign In
              </Link>

              <Link
                href="/register"
                className="px-5 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-extrabold shadow-md shadow-[#e05a38]/25 transition-all hover:scale-105 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                Register Organization
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
