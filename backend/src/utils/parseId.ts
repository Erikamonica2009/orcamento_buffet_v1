import { AppError } from "../middlewares/AppError";

export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, "Identificador inválido");
  }
  return id;
}
