'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Shield, Lock } from 'lucide-react';
import { AntiCheatViolation } from '@/hooks/useAntiCheat';

interface AntiCheatWarningModalProps {
  isOpen: boolean;
  violation: AntiCheatViolation | null;
  violationCount: number;
  maxViolations: number;
  isFlagged: boolean;
  onDismiss: () => void;
}

export function AntiCheatWarningModal({
  isOpen,
  violation,
  violationCount,
  maxViolations,
  isFlagged,
  onDismiss,
}: AntiCheatWarningModalProps) {
  if (!isOpen && !isFlagged) return null;

  const remaining = Math.max(0, maxViolations - violationCount);
  const isFinalViolation = violationCount >= maxViolations || isFlagged;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border shadow-2xl space-y-6 text-center transform transition-all ${
          isFinalViolation ? 'border-rose-300 ring-4 ring-rose-100' : 'border-amber-300 ring-4 ring-amber-100'
        }`}
      >
        {/* Icon Header */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
            isFinalViolation
              ? 'bg-rose-100 border border-rose-200 text-rose-600 animate-bounce'
              : 'bg-amber-100 border border-amber-200 text-amber-600'
          }`}
        >
          {isFinalViolation ? <ShieldAlert className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>

        {/* Title & Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
            <Shield className="w-3.5 h-3.5" />
            <span>Proctoring Alert</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {isFinalViolation ? 'Max Violations Reached' : `Violation ${violationCount} of ${maxViolations}`}
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {violation?.reason || 'An action outside the quiz rules was detected.'}
          </p>
        </div>

        {/* Status Metrics Box */}
        <div
          className={`p-4 rounded-2xl text-left border ${
            isFinalViolation ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className={isFinalViolation ? 'text-rose-900' : 'text-amber-900'}>
              {isFinalViolation ? 'Attempt Status' : 'Remaining Allowances'}
            </span>
            <span className={`font-mono font-black ${isFinalViolation ? 'text-rose-600' : 'text-amber-700'}`}>
              {isFinalViolation ? 'FLAGGED & AUTO-SUBMITTING' : `${remaining} left`}
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isFinalViolation ? 'bg-rose-600' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (violationCount / maxViolations) * 100)}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {isFinalViolation
              ? 'Your quiz attempt is being submitted immediately and flagged for organizer review.'
              : `Leaving this tab or switching windows will automatically submit your quiz when you reach ${maxViolations} violations.`}
          </p>
        </div>

        {/* Action Button */}
        <div>
          {isFinalViolation ? (
            <div className="p-3 rounded-2xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Auto-Submitting Answers...</span>
            </div>
          ) : (
            <button
              onClick={onDismiss}
              type="button"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/25 transition hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>I Understand & Return to Quiz</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Proctoring HUD indicator badge for the quiz arena top bar
 */
export function AntiCheatStatusBadge({
  enabled,
  violationCount,
  maxViolations,
}: {
  enabled?: boolean;
  violationCount: number;
  maxViolations: number;
}) {
  if (!enabled) return null;

  const hasViolations = violationCount > 0;

  return (
    <div
      className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-colors ${
        hasViolations
          ? 'bg-amber-50 border-amber-300 text-amber-800'
          : 'bg-emerald-50 border-emerald-300 text-emerald-800'
      }`}
      title="Anti-Cheating Proctoring Mode Active"
    >
      <div className="relative">
        <Shield className="w-4 h-4" />
        <span
          className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
            hasViolations ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
          }`}
        ></span>
      </div>
      <span className="text-[11px]">
        {hasViolations ? `Violations: ${violationCount}/${maxViolations}` : 'Proctoring Active'}
      </span>
    </div>
  );
}
