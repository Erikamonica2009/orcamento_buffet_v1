import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

// The admin and cliente login routes each have their own createRateLimiter(60_000, 5)
// instance (5 requests allowed per minute, 6th blocked). Vitest isolates each test file's
// module registry (see vitest.config.ts), so these in-memory limiters start fresh here and
// are unaffected by attempts made in auth.test.ts.
const WRONG_CREDS = { email: "rate-limit-test@buffet.com", senha: "senha-errada" };

afterAll(async () => {
  await prisma.$disconnect();
});

describe("rate limiting on real auth routes", () => {
  it("blocks POST /auth/admin/login after 5 attempts, while leaving /auth/cliente/login unaffected", async () => {
    let lastStatus = 0;

    for (let i = 0; i < 6; i++) {
      const res = await request(app).post("/auth/admin/login").send(WRONG_CREDS);
      lastStatus = res.status;
      if (i < 5) {
        // Wrong credentials, but still under the limit — rejected on auth, not on rate limit.
        expect(res.status).toBe(401);
      }
    }

    expect(lastStatus).toBe(429);

    // The cliente login limiter is a separate instance from the admin one. Even though the
    // admin limiter above is now exhausted, cliente login should still evaluate credentials
    // normally (401), not be blocked by the admin limiter's state (429).
    const clienteRes = await request(app).post("/auth/cliente/login").send(WRONG_CREDS);
    expect(clienteRes.status).toBe(401);
  });
});
