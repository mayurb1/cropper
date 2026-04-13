import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight toast state for success / info messages (no external UI library).
 */
export function useToast(durationMs = 3200) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clear = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setMessage(null);
  }, []);

  const show = useCallback(
    (msg: string) => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
      setMessage(msg);
      timerRef.current = setTimeout(() => {
        setMessage(null);
        timerRef.current = undefined;
      }, durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => clear(), [clear]);

  return { message, show, clear };
}
