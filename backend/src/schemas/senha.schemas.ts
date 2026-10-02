import { z } from "zod";

// Política de senha de clientes e administradores: 6 a 16 caracteres, com letra maiúscula,
// letra minúscula, número e caractere especial (qualquer símbolo que não seja letra, número ou
// espaço). O frontend repete a regra só para dar feedback imediato; quem garante é este schema.
export const SENHA_MIN = 6;
export const SENHA_MAX = 16;

export const senhaSchema = z
  .string()
  .min(SENHA_MIN, `A senha deve ter no mínimo ${SENHA_MIN} caracteres`)
  .max(SENHA_MAX, `A senha deve ter no máximo ${SENHA_MAX} caracteres`)
  .regex(/\p{Lu}/u, "A senha deve conter ao menos uma letra maiúscula")
  .regex(/\p{Ll}/u, "A senha deve conter ao menos uma letra minúscula")
  .regex(/\p{N}/u, "A senha deve conter ao menos um número")
  .regex(/[^\p{L}\p{N}\s]/u, "A senha deve conter ao menos um caractere especial");
