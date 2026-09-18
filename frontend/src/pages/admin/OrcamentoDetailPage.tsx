import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Orcamento,
  STATUS_LABELS,
  getOrcamento,
  updateOrcamentoStatus,
} from "../../services/orcamentos.service";
import { sanitizeText } from "../../utils/sanitize";
import { formatDataEvento } from "../../utils/date";
import { FormField } from "../../components/FormField";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { ApiError } from "../../services/api";

const decisaoSchema = z
  .object({
    status: z.enum(["EM_ANALISE", "APROVADO", "RECUSADO"]),
    valorTotal: z.coerce.number().positive().optional(),
  })
  .refine((data) => data.status !== "APROVADO" || data.valorTotal !== undefined, {
    message: "Informe o valor total para aprovar o orçamento",
    path: ["valorTotal"],
  });

type DecisaoForm = z.infer<typeof decisaoSchema>;

export function OrcamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<DecisaoForm | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DecisaoForm>({
    resolver: zodResolver(decisaoSchema),
    defaultValues: { status: "EM_ANALISE" },
  });

  const statusEscolhido = watch("status");

  useEffect(() => {
    if (!id) return;
    getOrcamento(Number(id))
      .then(setOrcamento)
      .catch(() => setApiError("Não foi possível carregar este orçamento."));
  }, [id]);

  const { submitting, guardedAction } = useSubmitGuard(async (data: DecisaoForm) => {
    if (!id) return;
    setApiError(null);
    try {
      const atualizado = await updateOrcamentoStatus(Number(id), data);
      setOrcamento(atualizado);
      setPendingStatus(null);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível atualizar o orçamento.");
      setPendingStatus(null);
    }
  });

  if (apiError && !orcamento) {
    return <p className="toast-error">{apiError}</p>;
  }

  if (!orcamento) {
    return <p className="loading">Carregando…</p>;
  }

  const jaRespondido = orcamento.status === "APROVADO" || orcamento.status === "RECUSADO";

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate("/orcamentos")}>
        Voltar
      </button>
      <h1>Orçamento #{orcamento.id}</h1>
      {apiError && <p className="toast-error">{apiError}</p>}

      <dl>
        <dt>Cliente</dt>
        <dd>
          {orcamento.cliente.nome} — {orcamento.cliente.email} — {orcamento.cliente.telefone}
        </dd>
        <dt>Tipo de evento</dt>
        <dd>{orcamento.tipoEvento.nome}</dd>
        <dt>Data do evento</dt>
        <dd>{formatDataEvento(orcamento.dataEvento)}</dd>
        <dt>Convidados</dt>
        <dd>{orcamento.numConvidados}</dd>
        <dt>Observações</dt>
        <dd>{sanitizeText(orcamento.observacoes ?? "Nenhuma")}</dd>
        <dt>Itens solicitados</dt>
        <dd>{orcamento.itens.map((oi) => oi.item.nome).join(", ")}</dd>
        <dt>Status</dt>
        <dd>{STATUS_LABELS[orcamento.status]}</dd>
        <dt>Valor total</dt>
        <dd>{orcamento.valorTotal ? `R$ ${orcamento.valorTotal}` : "—"}</dd>
      </dl>

      {!jaRespondido && (
        <form onSubmit={handleSubmit((data) => setPendingStatus(data))} noValidate>
          <div className="form-field">
            <label htmlFor="status">Decisão</label>
            <select id="status" {...register("status")}>
              <option value="EM_ANALISE">Marcar em análise</option>
              <option value="APROVADO">Aprovar</option>
              <option value="RECUSADO">Recusar</option>
            </select>
          </div>
          {statusEscolhido === "APROVADO" && (
            <FormField
              label="Valor total (R$)"
              type="number"
              step="0.01"
              min={0}
              {...register("valorTotal")}
              error={errors.valorTotal?.message}
            />
          )}
          <button className="btn" type="submit" disabled={submitting}>
            Salvar decisão
          </button>
        </form>
      )}

      <ConfirmDialog
        open={pendingStatus !== null}
        title="Confirmar decisão"
        message={
          pendingStatus?.status === "APROVADO"
            ? `Aprovar este orçamento por R$ ${pendingStatus.valorTotal}?`
            : pendingStatus?.status === "RECUSADO"
              ? "Recusar este orçamento? Esta decisão não pode ser desfeita."
              : "Marcar este orçamento como em análise?"
        }
        onConfirm={() => {
          if (pendingStatus) return guardedAction(pendingStatus);
        }}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
