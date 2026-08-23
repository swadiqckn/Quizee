'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  LogIn,
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

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center mx-auto text-[#e05a38]">
          <Gift className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Sign In to Access Referral Rewards</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Get your unique referral link, invite friends and earn bonus points for tournaments.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-6 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-black text-xs shadow-md shadow-[#e05a38]/20 transition"
          >
            Sign In with Google
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-xs transition"
          >
            Create Host Account
          </Link>
        </div>
      </div>
    );
  }

  const myReferrals = referrals.filter((r) => r.referrer_id === currentUser.id);
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/explore?ref=${currentUser.referral_code}`
    : `https://quizee.com/explore?ref=${currentUser.referral_code}`;

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
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fff0ea] border border-[#ffd5c4] text-[#c2411d] text-xs font-black uppercase tracking-wider">
          <Gift className="w-3.5 h-3.5 text-[#e05a38]" />
          Viral Referral & Growth Rewards
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Invite Friends & Earn Points</h1>
        <p className="text-slate-600 text-sm">
          Share your referral link with colleagues and classmates. Earn leaderboard points and boost tournament qualification standings!
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Total Friends Referred</span>
            <Users className="w-4 h-4 text-[#e05a38]" />
          </div>
          <p className="text-3xl font-black text-slate-900">{currentUser.total_referrals}</p>
          <p className="text-[11px] text-slate-400 font-medium">Active registered referees</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Referral Points Earned</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-[#b45309]">{currentUser.total_referrals * 25} pts</p>
          <p className="text-[11px] text-slate-400 font-medium">+25 pts credited per active invite</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Your Global Balance</span>
            <Award className="w-4 h-4 text-[#e05a38]" />
          </div>
          <p className="text-3xl font-black text-[#e05a38]">{currentUser.total_points} pts</p>
          <p className="text-[11px] text-slate-400 font-medium">Includes quiz scores + referral bonuses</p>
        </div>
      </div>

      {/* Share Box & Claim Box Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Share Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#e05a38]" />
              Your Shareable Invite Link
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Anyone registering with your link will automatically be attributed to you.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
              Referral Code: <strong className="text-slate-900 font-mono">{currentUser.referral_code}</strong>
            </label>

            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2.5 rounded-xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-black transition flex items-center gap-1.5 shrink-0"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] text-xs text-[#c2411d] space-y-1 font-medium">
            <p className="font-black">How rewards work:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
              <li>You get +25 points immediately when a friend uses your link.</li>
              <li>Your friend receives a +10 points welcome bonus.</li>
              <li>Referral points help you qualify in selective tournaments.</li>
            </ul>
          </div>
        </div>

        {/* Claim Friend's Code Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#e05a38]" />
              Claim a Friend's Referral Code
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Were you referred by another contestant? Enter their code below to receive 10 points!
            </p>
          </div>

          <form onSubmit={handleClaimCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Enter Referral Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ACME2026, SUPER99"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-black transition shadow-md shadow-[#e05a38]/20"
                >
                  Apply Code
                </button>
              </div>
            </div>

            {claimStatus.type === 'success' && (
              <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{claimStatus.message}</span>
              </div>
            )}

            {claimStatus.type === 'error' && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{claimStatus.message}</span>
              </div>
            )}
          </form>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">
              {currentUser.referred_by
                ? '✅ You have already claimed a referral bonus.'
                : '💡 You can only claim one referrer code.'}
            </p>
          </div>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-4 shadow-sm">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#e05a38]" />
          Your Referral Activity
        </h2>

        {myReferrals.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">You haven't referred any friends yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myReferrals.map((ref) => (
              <div key={ref.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900">
                    {ref.referee?.full_name || `@${ref.referee?.username}` || 'New Contestant'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Joined {formatDate(ref.created_at)}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs font-black">
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
