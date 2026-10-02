import { z } from "zod";

// Mesma política de senha (clientes e administradores) aplicada no backend (backend/src/schemas/senha.schemas.ts).
// Aqui serve só para feedback imediato no formulário; o backend é quem garante a regra.
export const SENHA_MIN = 6;
export const SENHA_MAX = 16;

export const SENHA_DICA = `De ${SENHA_MIN} a ${SENHA_MAX} caracteres, com letra maiúscula, letra minúscula, número e caractere especial.`;

export const senhaSchema = z
  .string()
  .min(SENHA_MIN, `A senha deve ter no mínimo ${SENHA_MIN} caracteres`)
  .max(SENHA_MAX, `A senha deve ter no máximo ${SENHA_MAX} caracteres`)
  .regex(/\p{Lu}/u, "A senha deve conter ao menos uma letra maiúscula")
  .regex(/\p{Ll}/u, "A senha deve conter ao menos uma letra minúscula")
  .regex(/\p{N}/u, "A senha deve conter ao menos um número")
  .regex(/[^\p{L}\p{N}\s]/u, "A senha deve conter ao menos um caractere especial");
