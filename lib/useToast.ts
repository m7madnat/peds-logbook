'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  tone: ToastTone;
}

/**
 * Shared toast logic: show a message, auto-dismiss it, and clean up timers.
 * Used by every page that needs "Case saved" / "Export ready" / error
 * feedback, so the show+auto-clear behavior only lives in one place.
 */
export function useToast(durationMs = 2400) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, tone });
      timerRef.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { toast, show };
}
