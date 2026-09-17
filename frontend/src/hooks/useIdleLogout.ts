import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll"] as const;

export function useIdleLogout(timeoutMs: number) {
  const { logout } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        logout();
      }, timeoutMs);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [timeoutMs, logout]);
}
