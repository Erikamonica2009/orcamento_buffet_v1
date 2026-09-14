import { z } from "zod";

export const orcamentoStatusEnum = z.enum(["PENDENTE", "EM_ANALISE", "APROVADO", "RECUSADO"]);

export const createOrcamentoSchema = z.object({
  tipoEventoId: z.number().int().positive(),
  dataEvento: z.coerce.date(),
  numConvidados: z.number().int().positive(),
  observacoes: z.string().optional(),
  itensIds: z.array(z.number().int().positive()).min(1, "Selecione ao menos um item"),
});

export const updateOrcamentoStatusSchema = z
  .object({
    status: z.enum(["EM_ANALISE", "APROVADO", "RECUSADO"]),
    valorTotal: z.number().positive().optional(),
  })
  .refine((data) => data.status !== "APROVADO" || data.valorTotal !== undefined, {
    message: "valorTotal é obrigatório para aprovar o orçamento",
    path: ["valorTotal"],
  });

export type CreateOrcamentoInput = z.infer<typeof createOrcamentoSchema>;
export type UpdateOrcamentoStatusInput = z.infer<typeof updateOrcamentoStatusSchema>;
