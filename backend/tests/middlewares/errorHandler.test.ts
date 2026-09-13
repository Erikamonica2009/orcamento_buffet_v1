import { describe, it, expect, vi } from "vitest";
import { errorHandler } from "../../src/middlewares/errorHandler";
import { AppError } from "../../src/middlewares/AppError";
import type { Request, Response } from "express";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("errorHandler", () => {
  it("responds with the AppError's status and message", () => {
    const res = mockRes();
    errorHandler(new AppError(404, "não encontrado"), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "não encontrado" });
  });

  it("responds with 500 and a generic message for unexpected errors, without leaking the message", () => {
    const res = mockRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    errorHandler(new Error("stack trace with secrets"), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Erro interno do servidor" });
    consoleSpy.mockRestore();
  });
});
