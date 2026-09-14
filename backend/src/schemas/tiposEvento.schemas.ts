import { z } from "zod";

export const createTipoEventoSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().min(1),
});

export const updateTipoEventoSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
});

export type CreateTipoEventoInput = z.infer<typeof createTipoEventoSchema>;
export type UpdateTipoEventoInput = z.infer<typeof updateTipoEventoSchema>;
