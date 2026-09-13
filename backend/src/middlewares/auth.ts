import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./AppError";

export type Role = "admin" | "cliente";

export interface AuthPayload {
  sub: number;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    throw new AppError(401, "Não autenticado");
  }

  try {
    req.auth = jwt.verify(token, env.jwtSecret) as unknown as AuthPayload;
    next();
  } catch {
    throw new AppError(401, "Sessão inválida ou expirada");
  }
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || req.auth.role !== role) {
      throw new AppError(403, "Acesso negado");
    }
    next();
  };
}
