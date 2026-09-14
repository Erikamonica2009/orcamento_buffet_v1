import { z } from "zod";

export const createClienteSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().min(8).max(20),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos numéricos"),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
