import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("app", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("unknown route returns 404 with a generic error, not a framework default page", async () => {
    const res = await request(app).get("/rota-que-nao-existe");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Rota não encontrada" });
  });
});
