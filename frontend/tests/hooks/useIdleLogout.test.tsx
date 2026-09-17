import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useIdleLogout } from "../../src/hooks/useIdleLogout";
import { AuthProvider } from "../../src/context/AuthContext";

describe("useIdleLogout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 }))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("triggers a new fetch (the logout call) after the timeout elapses with no activity", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    renderHook(() => useIdleLogout(1000), { wrapper });

    const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await vi.advanceTimersByTimeAsync(1000);
    const callsAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    expect(callsAfter).toBeGreaterThan(callsBefore);
  });
});
