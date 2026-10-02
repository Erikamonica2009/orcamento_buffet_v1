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

// Data do evento: de hoje até MAX_ANOS_ANTECEDENCIA anos à frente (mesmo limite do frontend).
// Aceita 1 dia de folga no passado porque o cliente envia meia-noite UTC do dia escolhido e,
// no fuso do Brasil (UTC-3), à noite o "hoje" local ainda é "ontem" em UTC.
export const MAX_ANOS_ANTECEDENCIA = 2;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

const dataEventoSchema = z.coerce
  .date({ errorMap: () => ({ message: "Data do evento inválida" }) })
  .superRefine((data, ctx) => {
    const agora = new Date();
    const inicioHojeUtc = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
    const limite = new Date(inicioHojeUtc);
    limite.setUTCFullYear(limite.getUTCFullYear() + MAX_ANOS_ANTECEDENCIA);

    if (data.getTime() < inicioHojeUtc - UM_DIA_MS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data do evento não pode estar no passado" });
    } else if (data.getTime() > limite.getTime() + UM_DIA_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `A data do evento deve ser em até ${MAX_ANOS_ANTECEDENCIA} anos`,
      });
    }
  });

export const createOrcamentoSchema = z.object({
  tipoEventoId: z.number().int().positive(),
  dataEvento: dataEventoSchema,
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
