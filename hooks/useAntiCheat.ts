'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ViolationType =
  | 'tab_switch'
  | 'window_blur'
  | 'copy_paste_attempt'
  | 'context_menu'
  | 'dev_tools_shortcut'
  | 'fullscreen_exit';

export interface AntiCheatViolation {
  id: string;
  type: ViolationType;
  reason: string;
  timestamp: number;
  violationNumber: number;
  maxViolations: number;
}

export interface UseAntiCheatOptions {
  /** Whether proctoring is enabled for this quiz */
  enabled?: boolean;
  /** Maximum violations allowed before auto-submitting (default: 3) */
  maxViolations?: number;
  /** Threshold in ms away before a blur event counts as a violation (default: 1200ms) */
  blurThresholdMs?: number;
  /** Safety debounce in ms to prevent duplicate events on single tab switch (default: 1000ms) */
  debounceMs?: number;
  /** Whether the quiz is currently active (e.g. not loading or already submitted) */
  isActive?: boolean;
  /** Callback fired on each detected violation */
  onViolation?: (violation: AntiCheatViolation) => void;
  /** Callback fired when max violations threshold is reached */
  onMaxViolationsReached?: (violationsCount: number) => void;
}

export interface UseAntiCheatReturn {
  violationCount: number;
  maxViolations: number;
  isFlagged: boolean;
  violationsLog: AntiCheatViolation[];
  lastViolation: AntiCheatViolation | null;
  isWarningModalOpen: boolean;
  dismissWarning: () => void;
  /** Fullscreen state and actions */
  isFullscreen: boolean;
  isFullScreenSupported: boolean;
  enterFullscreen: () => Promise<boolean>;
  /** Props and styles to apply on the quiz runner container for content copy protection */
  containerProps: {
    onContextMenu: (e: React.MouseEvent) => void;
    onCopy: (e: React.ClipboardEvent) => void;
    onCut: (e: React.ClipboardEvent) => void;
    onPaste: (e: React.ClipboardEvent) => void;
    onSelectStart: (e: React.SyntheticEvent) => void;
    className: string;
    style: React.CSSProperties;
  };
}

export function useAntiCheat({
  enabled = false,
  maxViolations = 3,
  blurThresholdMs = 1200,
  debounceMs = 1000,
  isActive = true,
  onViolation,
  onMaxViolationsReached,
}: UseAntiCheatOptions = {}): UseAntiCheatReturn {
  const [violationCount, setViolationCount] = useState<number>(0);
  const [violationsLog, setViolationsLog] = useState<AntiCheatViolation[]>([]);
  const [lastViolation, setLastViolation] = useState<AntiCheatViolation | null>(null);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState<boolean>(false);
  const [isFlagged, setIsFlagged] = useState<boolean>(false);

  // Fullscreen state
  const checkIsFullscreen = (): boolean => {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFullScreenSupported, setIsFullScreenSupported] = useState<boolean>(true);
  const hasEnteredFullscreenRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isSupported = Boolean(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
    setIsFullScreenSupported(isSupported);
    const inFull = checkIsFullscreen();
    setIsFullscreen(inFull);
    if (inFull) {
      hasEnteredFullscreenRef.current = true;
    }
  }, []);

  // Refs to maintain current values without triggering effect re-subscriptions
  const enabledRef = useRef(enabled);
  const isActiveRef = useRef(isActive);
  const maxViolationsRef = useRef(maxViolations);
  const blurThresholdMsRef = useRef(blurThresholdMs);
  const debounceMsRef = useRef(debounceMs);
  const onViolationRef = useRef(onViolation);
  const onMaxViolationsReachedRef = useRef(onMaxViolationsReached);
  const isFlaggedRef = useRef(isFlagged);

  const blurTimestampRef = useRef<number | null>(null);
  const lastViolationTimestampRef = useRef<number>(0);
  const violationCountRef = useRef<number>(0);

  // Synchronize refs
  useEffect(() => {
    enabledRef.current = enabled;
    isActiveRef.current = isActive;
    maxViolationsRef.current = maxViolations;
    blurThresholdMsRef.current = blurThresholdMs;
    debounceMsRef.current = debounceMs;
    onViolationRef.current = onViolation;
    onMaxViolationsReachedRef.current = onMaxViolationsReached;
    isFlaggedRef.current = isFlagged;
  }, [enabled, isActive, maxViolations, blurThresholdMs, debounceMs, onViolation, onMaxViolationsReached, isFlagged]);

  /**
   * Request full-screen mode helper
   */
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    if (typeof document === 'undefined') return false;
    try {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      hasEnteredFullscreenRef.current = true;
      return true;
    } catch (err) {
      console.warn('Fullscreen request failed or was not allowed:', err);
      return false;
    }
  }, []);

  /**
   * Internal violation handler with safety debouncing & threshold checks
   */
  const triggerViolation = useCallback(
    (type: ViolationType, reason: string) => {
      if (!enabledRef.current || !isActiveRef.current || isFlaggedRef.current) {
        return;
      }

      const now = Date.now();
      // Debounce protection: ignore duplicate burst events within debounce window
      if (now - lastViolationTimestampRef.current < debounceMsRef.current) {
        return;
      }
      lastViolationTimestampRef.current = now;

      const nextCount = violationCountRef.current + 1;
      violationCountRef.current = nextCount;
      setViolationCount(nextCount);

      const violation: AntiCheatViolation = {
        id: `v-${now}-${Math.random().toString(36).substr(2, 6)}`,
        type,
        reason,
        timestamp: now,
        violationNumber: nextCount,
        maxViolations: maxViolationsRef.current,
      };

      setViolationsLog((prev) => [...prev, violation]);
      setLastViolation(violation);
      setIsWarningModalOpen(true);

      onViolationRef.current?.(violation);

      // Check if limit exceeded
      if (nextCount >= maxViolationsRef.current) {
        setIsFlagged(true);
        isFlaggedRef.current = true;
        onMaxViolationsReachedRef.current?.(nextCount);
      }
    },
    []
  );

  const dismissWarning = useCallback(() => {
    setIsWarningModalOpen(false);
  }, []);

  // 0. Fullscreen Mode Exit Detection
  useEffect(() => {
    if (!enabled || !isActive) return;

    const handleFullscreenChange = () => {
      const inFull = checkIsFullscreen();
      setIsFullscreen(inFull);

      if (inFull) {
        hasEnteredFullscreenRef.current = true;
      } else if (enabledRef.current && isActiveRef.current && hasEnteredFullscreenRef.current) {
        // Participant was in full-screen and disabled or exited it!
        triggerViolation(
          'fullscreen_exit',
          'Exiting full-screen mode is prohibited during proctored competitions.'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [enabled, isActive, triggerViolation]);

  // 1. Tab / App Switch Visibility Detection
  useEffect(() => {
    if (!enabled || !isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Document went into background
        triggerViolation('tab_switch', 'Leaving or switching away from the quiz tab is prohibited.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isActive, triggerViolation]);

  // 2. Window Focus & Mobile Overlay Detection with threshold
  useEffect(() => {
    if (!enabled || !isActive) return;

    const handleBlur = () => {
      blurTimestampRef.current = Date.now();
    };

    const handleFocus = () => {
      if (blurTimestampRef.current !== null) {
        const timeAway = Date.now() - blurTimestampRef.current;
        blurTimestampRef.current = null;

        // If away time exceeds threshold (e.g. > 1.2s to account for system dialogs/notifications)
        if (timeAway >= blurThresholdMsRef.current) {
          triggerViolation(
            'window_blur',
            `Window focus lost for ${(timeAway / 1000).toFixed(1)}s (switching apps or overlays is restricted).`
          );
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, isActive, triggerViolation]);

  // 3. Global Content Protection & Keyboard Shortcuts Blocking
  useEffect(() => {
    if (!enabled || !isActive) return;

    // Block right click / context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation('context_menu', 'Right-click and context menu are disabled during the quiz.');
      return false;
    };

    // Block copy / cut / paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('copy_paste_attempt', 'Copying question content is prohibited.');
      return false;
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('copy_paste_attempt', 'Cutting content is prohibited.');
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('copy_paste_attempt', 'Pasting content is prohibited.');
      return false;
    };

    // Block developer shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+P, Ctrl+C)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // F12 or Inspect shortcuts
      if (
        e.key === 'F12' ||
        (isCtrlOrCmd && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) ||
        (isCtrlOrCmd && (e.key === 'p' || e.key === 'P'))
      ) {
        e.preventDefault();
        triggerViolation('dev_tools_shortcut', 'Developer inspection and page actions are disabled.');
        return false;
      }

      // Block Ctrl+C / Cmd+C for copy
      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        triggerViolation('copy_paste_attempt', 'Keyboard copying is prohibited.');
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, isActive, triggerViolation]);

  // Container props with CSS and local handlers for content protection
  const containerProps = {
    onContextMenu: (e: React.MouseEvent) => {
      if (enabled && isActive) {
        e.preventDefault();
        triggerViolation('context_menu', 'Right-click and context menu are disabled.');
      }
    },
    onCopy: (e: React.ClipboardEvent) => {
      if (enabled && isActive) {
        e.preventDefault();
        triggerViolation('copy_paste_attempt', 'Copying question content is prohibited.');
      }
    },
    onCut: (e: React.ClipboardEvent) => {
      if (enabled && isActive) {
        e.preventDefault();
        triggerViolation('copy_paste_attempt', 'Cutting content is prohibited.');
      }
    },
    onPaste: (e: React.ClipboardEvent) => {
      if (enabled && isActive) {
        e.preventDefault();
        triggerViolation('copy_paste_attempt', 'Pasting content is prohibited.');
      }
    },
    onSelectStart: (e: React.SyntheticEvent) => {
      if (enabled && isActive) {
        e.preventDefault();
      }
    },
    className: enabled && isActive ? 'select-none' : '',
    style: enabled && isActive
      ? {
          userSelect: 'none' as const,
          WebkitUserSelect: 'none' as const,
          MozUserSelect: 'none' as const,
          msUserSelect: 'none' as const,
          WebkitTouchCallout: 'none' as const,
        }
      : {},
  };

  return {
    violationCount,
    maxViolations,
    isFlagged,
    violationsLog,
    lastViolation,
    isWarningModalOpen,
    dismissWarning,
    isFullscreen,
    isFullScreenSupported,
    enterFullscreen,
    containerProps,
  };
}
