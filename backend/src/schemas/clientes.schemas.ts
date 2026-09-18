import { z } from "zod";
import { isValidCpf } from "../utils/cpf";

const cpfSchema = z
  .string()
  .regex(/^\d{11}$/, "CPF deve conter 11 dígitos numéricos")
  .refine(isValidCpf, "CPF inválido");

export const createClienteSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().min(8).max(20),
  cpf: cpfSchema,
});

export const updateClienteSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6).optional(),
  telefone: z.string().min(8).max(20).optional(),
  cpf: cpfSchema.optional(),
  ativo: z.boolean().optional(),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
