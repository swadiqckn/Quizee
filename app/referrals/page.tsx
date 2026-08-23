'use client';

import React, { useState } from 'react';
import {
  Gift,
  Sparkles,
  Users,
  Copy,
  CheckCircle2,
  Share2,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatDate } from '@/lib/utils';

export default function ReferralsPage() {
  const { currentUser, referrals, applyReferralCode } = useQuizPlatform();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [claimStatus, setClaimStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  const myReferrals = referrals.filter((r) => r.referrer_id === currentUser.id);
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/explore?ref=${currentUser.referral_code}`
    : `https://quizarena.com/explore?ref=${currentUser.referral_code}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const success = applyReferralCode(inputCode.trim());
    if (success) {
      setClaimStatus({
        type: 'success',
        message: '🎉 Referral code applied! You earned +10 bonus points, and your referrer earned +25 points!',
      });
      setInputCode('');
    } else {
      setClaimStatus({
        type: 'error',
        message: 'Invalid referral code or cannot refer yourself.',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold">
          <Gift className="w-3.5 h-3.5 text-pink-400" />
          Viral Referral & Growth Rewards
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Invite Friends & Earn Points</h1>
        <p className="text-slate-400 text-sm">
          Share your referral link with colleagues and classmates. Earn leaderboard points and boost tournament qualification standings!
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Friends Referred</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{currentUser.total_referrals}</p>
          <p className="text-[11px] text-slate-500">Active registered referees</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Referral Points Earned</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400">{currentUser.total_referrals * 25} pts</p>
          <p className="text-[11px] text-slate-500">+25 pts credited per active invite</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Your Global Balance</span>
            <Award className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-3xl font-extrabold text-pink-400">{currentUser.total_points} pts</p>
          <p className="text-[11px] text-slate-500">Includes quiz scores + referral bonuses</p>
        </div>
      </div>

      {/* Share Box & Claim Box Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Share Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" />
              Your Shareable Invite Link
            </h2>
            <p className="text-xs text-slate-400">
              Anyone registering with your link will automatically be attributed to you.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Referral Code: <strong className="text-white font-mono">{currentUser.referral_code}</strong>
            </label>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
            <p className="font-semibold">How rewards work:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
              <li>You get +25 points immediately when a friend uses your link.</li>
              <li>Your friend receives a +10 points welcome bonus.</li>
              <li>Referral points help you qualify in selective tournaments.</li>
            </ul>
          </div>
        </div>

        {/* Claim Friend's Code Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-400" />
              Claim a Friend's Referral Code
            </h2>
            <p className="text-xs text-slate-400">
              Were you referred by another contestant? Enter their code below to receive 10 points!
            </p>
          </div>

          <form onSubmit={handleClaimCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Enter Referral Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ACME2026, SUPER99"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition shadow-md shadow-pink-600/20"
                >
                  Apply Code
                </button>
              </div>
            </div>

            {claimStatus.type === 'success' && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{claimStatus.message}</span>
              </div>
            )}

            {claimStatus.type === 'error' && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{claimStatus.message}</span>
              </div>
            )}
          </form>

          <div className="pt-2 border-t border-slate-800">
            <p className="text-[11px] text-slate-500">
              {currentUser.referred_by
                ? '✅ You have already claimed a referral bonus.'
                : '💡 You can only claim one referrer code.'}
            </p>
          </div>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Your Referral Activity
        </h2>

        {myReferrals.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-800/60">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">You haven't referred any friends yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {myReferrals.map((ref) => (
              <div key={ref.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">
                    {ref.referee?.full_name || 'New Contestant'}
                  </p>
                  <p className="text-[10px] text-slate-500">Joined {formatDate(ref.created_at)}</p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  +{ref.bonus_points_awarded} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
