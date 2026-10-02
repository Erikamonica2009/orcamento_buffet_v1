import { z } from "zod";
import { senhaSchema } from "./senha.schemas";

export const createAdminSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: senhaSchema,
});

export const updateAdminSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  senha: senhaSchema.optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
