import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { requireAuth, requireRole } from "../../src/middlewares/auth";
import { env } from "../../src/config/env";
import type { Request, Response } from "express";

function mockReq(cookies: Record<string, string> = {}): Request {
  return { cookies } as unknown as Request;
}

describe("requireAuth", () => {
  it("calls next() and attaches req.auth for a valid token", () => {
    const token = jwt.sign({ sub: 1, role: "admin" }, env.jwtSecret);
    const req = mockReq({ token });
    const next = vi.fn();

    requireAuth(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.auth).toEqual({ sub: 1, role: "admin", iat: expect.any(Number) });
  });

  it("throws AppError(401) when there is no token", () => {
    const req = mockReq();
    expect(() => requireAuth(req, {} as Response, vi.fn())).toThrow("Não autenticado");
  });

  it("throws AppError(401) for a garbage token", () => {
    const req = mockReq({ token: "not-a-real-jwt" });
    expect(() => requireAuth(req, {} as Response, vi.fn())).toThrow("Sessão inválida ou expirada");
  });
});

describe("requireRole", () => {
  it("calls next() when the role matches", () => {
    const req = { auth: { sub: 1, role: "admin" } } as unknown as Request;
    const next = vi.fn();
    requireRole("admin")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("throws AppError(403) when the role does not match", () => {
    const req = { auth: { sub: 1, role: "cliente" } } as unknown as Request;
    expect(() => requireRole("admin")(req, {} as Response, vi.fn())).toThrow("Acesso negado");
  });
});
