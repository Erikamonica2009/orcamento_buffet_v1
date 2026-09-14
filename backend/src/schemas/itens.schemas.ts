import { z } from "zod";

export const itemCategoriaEnum = z.enum([
  "COMIDA",
  "BEBIDA",
  "DECORACAO",
  "ESTRUTURA",
  "ENTRETENIMENTO",
]);

export const createItemSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().min(1),
  categoria: itemCategoriaEnum,
});

export const updateItemSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().min(1).optional(),
  categoria: itemCategoriaEnum.optional(),
  ativo: z.boolean().optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
