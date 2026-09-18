import { z } from "zod";

export const orcamentoStatusEnum = z.enum([
  "PENDENTE",
  "EM_ANALISE",
  "AGUARDANDO_ACEITE_CLIENTE",
  "AGUARDANDO_PAGAMENTO",
  "APROVADO",
  "RECUSADO",
]);

const STATUS_QUE_EXIGEM_VALOR = ["AGUARDANDO_ACEITE_CLIENTE", "AGUARDANDO_PAGAMENTO", "APROVADO"] as const;

export const createOrcamentoSchema = z.object({
  tipoEventoId: z.number().int().positive(),
  dataEvento: z.coerce.date(),
  numConvidados: z.number().int().positive(),
  observacoes: z.string().optional(),
  itensIds: z
    .array(z.number().int().positive())
    .min(1, "Selecione ao menos um item")
    .refine((ids) => new Set(ids).size === ids.length, { message: "Itens duplicados" }),
});

export const updateOrcamentoStatusSchema = z
  .object({
    status: z.enum([
      "EM_ANALISE",
      "AGUARDANDO_ACEITE_CLIENTE",
      "AGUARDANDO_PAGAMENTO",
      "APROVADO",
      "RECUSADO",
    ]),
    valorTotal: z.number().positive().optional(),
  })
  .refine(
    (data) =>
      !STATUS_QUE_EXIGEM_VALOR.includes(data.status as (typeof STATUS_QUE_EXIGEM_VALOR)[number]) ||
      data.valorTotal !== undefined,
    {
      message: "valorTotal é obrigatório para este status",
      path: ["valorTotal"],
    }
  );

export const respostaClienteSchema = z.object({
  aceitar: z.boolean(),
});

export type CreateOrcamentoInput = z.infer<typeof createOrcamentoSchema>;
export type UpdateOrcamentoStatusInput = z.infer<typeof updateOrcamentoStatusSchema>;
export type RespostaClienteInput = z.infer<typeof respostaClienteSchema>;
