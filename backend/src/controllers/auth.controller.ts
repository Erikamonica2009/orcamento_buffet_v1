import { Router, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { loginSchema } from "../schemas/auth.schemas";
import { loginAdmin, loginCliente } from "../services/auth.service";
import { createRateLimiter } from "../middlewares/rateLimit";
import { env } from "../config/env";

export const authRouter = Router();

const loginLimiter = createRateLimiter(60_000, 5);

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

authRouter.post(
  "/admin/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, senha } = loginSchema.parse(req.body);
    const { token, admin } = await loginAdmin(email, senha);
    setAuthCookie(res, token);
    res.json(admin);
  })
);

authRouter.post(
  "/cliente/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, senha } = loginSchema.parse(req.body);
    const { token, cliente } = await loginCliente(email, senha);
    setAuthCookie(res, token);
    res.json(cliente);
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.status(204).send();
});
