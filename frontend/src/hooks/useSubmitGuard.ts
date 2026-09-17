import { useCallback, useState } from "react";

export function useSubmitGuard<Args extends unknown[]>(action: (...args: Args) => Promise<void>) {
  const [submitting, setSubmitting] = useState(false);

  const guardedAction = useCallback(
    async (...args: Args) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        await action(...args);
      } finally {
        setSubmitting(false);
      }
    },
    [action, submitting]
  );

  return { submitting, guardedAction };
}
