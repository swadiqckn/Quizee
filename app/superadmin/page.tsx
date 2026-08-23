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
  const [primaryColor, setPrimaryColor] = useState('#e05a38');

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Superadmin Access Required</h2>
        <p className="text-xs text-slate-500">
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#e05a38] text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Superadmin Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">Tenant Organizations</h1>
        </div>

        {!isAddingOrg && (
          <button
            onClick={() => setIsAddingOrg(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-black text-xs shadow-lg shadow-[#e05a38]/20 transition"
          >
            <Plus className="w-4 h-4" />
            Create Tenant Org
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Total Tenants</span>
            <Building2 className="w-4 h-4 text-[#e05a38]" />
          </div>
          <p className="text-3xl font-black text-slate-900">{organisations.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Isolated organization workspaces</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Total Competitions</span>
            <Trophy className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{quizzes.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Across all tenants</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Total Registered Users</span>
            <Users className="w-4 h-4 text-[#15803d]" />
          </div>
          <p className="text-3xl font-black text-slate-900">{allUsers.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Participants & administrators</p>
        </div>
      </div>

      {/* Add Org Form */}
      {isAddingOrg && (
        <div className="p-8 rounded-3xl bg-white border-2 border-[#e05a38] space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900">Add New Tenant Organization</h2>
            <button onClick={() => setIsAddingOrg(false)} className="text-xs font-bold text-slate-500 hover:text-slate-900">
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford Tech League"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (!orgSlug) setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Tenant Slug / Subdomain *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. stanford-tech"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingOrg(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-black text-xs shadow-md shadow-[#e05a38]/20 transition"
              >
                Create Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Organizations List */}
      <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Active Tenant Workspaces</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organisations.map((org) => {
            const orgQuizzesCount = quizzes.filter((q) => q.org_id === org.id).length;

            return (
              <div
                key={org.id}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{org.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">slug: {org.slug}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase ${
                      org.plan === 'plus'
                        ? 'bg-[#fff0ea] text-[#c2411d] border border-[#ffd8cb]'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {org.plan} Plan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600 font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Quizzes Active</span>
                    <strong className="text-slate-900">{orgQuizzesCount} Competitions</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Joined</span>
                    <strong className="text-slate-900">{formatDate(org.created_at)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
