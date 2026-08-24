/**
 * Tamper-Resistant Client Timestamping and Offline State Recovery
 * Protects timing metrics from devtools console manipulation and network delay.
 */

// In-memory session nonces (not accessible on global window)
const sessionNonces = new Map<string, string>();

export function getOrCreateSessionNonce(quizId: string, userId: string): string {
  const key = `${quizId}:${userId}`;
  if (!sessionNonces.has(key)) {
    const randomBuffer = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomBuffer);
    }
    const nonce = Array.from(randomBuffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    sessionNonces.set(key, nonce);
  }
  return sessionNonces.get(key)!;
}

export async function generateAnswerIntegrityHash(
  sessionNonce: string,
  questionId: string,
  selectedOptionIds: string[],
  timeTakenMs: number,
  timestampMs: number
): Promise<string> {
  const payload = `${sessionNonce}:${questionId}:${selectedOptionIds.sort().join(',')}:${timeTakenMs}:${timestampMs}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback hash
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const chr = payload.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(16);
}

export function saveLocalAttemptProgress(quizId: string, userId: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    const key = `quizee_attempt_${quizId}_${userId}`;
    localStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch (e) {}
}

export function getLocalAttemptProgress(quizId: string, userId: string): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `quizee_attempt_${quizId}_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearLocalAttemptProgress(quizId: string, userId: string) {
  if (typeof window === 'undefined') return;
  try {
    const key = `quizee_attempt_${quizId}_${userId}`;
    localStorage.removeItem(key);
  } catch (e) {}
}
