import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "./AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Dados inválidos",
      detalhes: err.issues.map((issue) => issue.message),
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
};
