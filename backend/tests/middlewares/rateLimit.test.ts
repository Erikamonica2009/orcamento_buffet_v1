import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { createRateLimiter } from "../../src/middlewares/rateLimit";

describe("createRateLimiter", () => {
  it("allows requests under the limit and blocks with 429 once exceeded", async () => {
    const app = express();
    app.use(createRateLimiter(60_000, 2));
    app.get("/ping", (_req, res) => res.json({ ok: true }));

    const first = await request(app).get("/ping");
    const second = await request(app).get("/ping");
    const third = await request(app).get("/ping");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body).toEqual({ error: "Muitas requisições. Tente novamente mais tarde." });
  });
});
