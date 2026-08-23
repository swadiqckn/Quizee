'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Users,
  Trophy,
  Plus,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatDate } from '@/lib/utils';
import { Organisation } from '@/lib/types';

export default function SuperadminPage() {
  const { organisations, quizzes, allUsers, currentUser } = useQuizPlatform();
  const [isAddingOrg, setIsAddingOrg] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  if (currentUser.role !== 'superadmin') {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Superadmin Access Required</h2>
        <p className="text-xs text-slate-400">
          Switch your active role to "Superadmin" in the top navbar to view the global tenant console.
        </p>
      </div>
    );
  }

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) return;

    const newOrg: Organisation = {
      id: `org-${Date.now()}`,
      name: orgName.trim(),
      slug: orgSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      logo_url: null,
      plan: 'free',
      quizzes_created_this_month: 0,
      settings: {
        primary_color: primaryColor,
        allow_public_registration: true,
      },
      created_at: new Date().toISOString(),
    };

    organisations.push(newOrg);
    setIsAddingOrg(false);
    setOrgName('');
    setOrgSlug('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Link */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Global Superadmin Console
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Multi-Tenant Management</h1>
        </div>

        <button
          onClick={() => setIsAddingOrg(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Create New Tenant Org
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Tenant Organizations</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{organisations.length}</p>
          <p className="text-[11px] text-slate-500">Isolated workspace domains</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Global Competitions</span>
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{quizzes.length}</p>
          <p className="text-[11px] text-slate-500">Across all organizations</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Platform Registered Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{allUsers.length}</p>
          <p className="text-[11px] text-slate-500">Superadmins, Admins, Participants</p>
        </div>
      </div>

      {/* New Org Form */}
      {isAddingOrg && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-indigo-500/30 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              Create Tenant Organization
            </h2>
            <button onClick={() => setIsAddingOrg(false)} className="text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateOrg} className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Organization Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Stanford AI Lab"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  if (!orgSlug) setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Tenant Slug (Unique Subpath) *</label>
              <input
                type="text"
                required
                placeholder="e.g. stanford-ai"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingOrg(false)}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                Create Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Organizations Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <h2 className="text-base font-bold text-white">Registered Tenant Organizations</h2>

        <div className="divide-y divide-slate-800/80">
          {organisations.map((org) => {
            const orgQuizCount = quizzes.filter((q) => q.org_id === org.id).length;
            return (
              <div key={org.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{org.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">slug: /{org.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{orgQuizCount} Competitions</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    Active Tenant
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
