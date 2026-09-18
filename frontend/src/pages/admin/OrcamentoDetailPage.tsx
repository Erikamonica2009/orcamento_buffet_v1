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
import { CATEGORIA_LABELS } from "../../services/itens.service";
import { sanitizeText } from "../../utils/sanitize";
import { formatDataEvento } from "../../utils/date";
import { FormField } from "../../components/FormField";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { ApiError } from "../../services/api";

const STATUS_QUE_EXIGEM_VALOR = ["AGUARDANDO_ACEITE_CLIENTE", "AGUARDANDO_PAGAMENTO", "APROVADO"] as const;

const decisaoSchema = z
  .object({
    status: z.enum([
      "EM_ANALISE",
      "AGUARDANDO_ACEITE_CLIENTE",
      "AGUARDANDO_PAGAMENTO",
      "APROVADO",
      "RECUSADO",
    ]),
    valorTotal: z.coerce.number().positive().optional(),
  })
  .refine(
    (data) =>
      !STATUS_QUE_EXIGEM_VALOR.includes(data.status as (typeof STATUS_QUE_EXIGEM_VALOR)[number]) ||
      data.valorTotal !== undefined,
    {
      message: "Informe o valor total para este status",
      path: ["valorTotal"],
    }
  );

type DecisaoForm = z.infer<typeof decisaoSchema>;

function confirmMessage(pendingStatus: DecisaoForm): string {
  switch (pendingStatus.status) {
    case "APROVADO":
      return `Aprovar este orçamento por R$ ${pendingStatus.valorTotal}?`;
    case "RECUSADO":
      return "Recusar este orçamento? Esta decisão não pode ser desfeita.";
    case "AGUARDANDO_ACEITE_CLIENTE":
      return `Marcar este orçamento como aguardando aceite do cliente, com valor de R$ ${pendingStatus.valorTotal}?`;
    case "AGUARDANDO_PAGAMENTO":
      return `Marcar este orçamento como aguardando pagamento, com valor de R$ ${pendingStatus.valorTotal}?`;
    default:
      return "Marcar este orçamento como em análise?";
  }
}

export function OrcamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<DecisaoForm | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DecisaoForm>({
    resolver: zodResolver(decisaoSchema),
    defaultValues: { status: "EM_ANALISE" },
  });

  useEffect(() => {
    if (!id) return;
    getOrcamento(Number(id))
      .then((data) => {
        setOrcamento(data);
        reset({
          status: "EM_ANALISE",
          valorTotal: data.valorTotal ? Number(data.valorTotal) : undefined,
        });
      })
      .catch(() => setApiError("Não foi possível carregar este orçamento."));
  }, [id, reset]);

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

      <h2>Resumo</h2>
      <table className="summary-table">
        <tbody>
          <tr>
            <th>Cliente</th>
            <td>
              {sanitizeText(orcamento.cliente.nome)} — {orcamento.cliente.email} — {orcamento.cliente.telefone}
            </td>
          </tr>
          <tr>
            <th>Tipo de evento</th>
            <td>{orcamento.tipoEvento.nome}</td>
          </tr>
          <tr>
            <th>Data do evento</th>
            <td>{formatDataEvento(orcamento.dataEvento)}</td>
          </tr>
          <tr>
            <th>Convidados</th>
            <td>{orcamento.numConvidados}</td>
          </tr>
          <tr>
            <th>Observações</th>
            <td>{sanitizeText(orcamento.observacoes ?? "Nenhuma")}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>{STATUS_LABELS[orcamento.status]}</td>
          </tr>
          <tr>
            <th>Valor total</th>
            <td>{orcamento.valorTotal ? `R$ ${orcamento.valorTotal}` : "—"}</td>
          </tr>
        </tbody>
      </table>

      <h2>Itens solicitados</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {orcamento.itens.map((oi) => (
            <tr key={oi.item.id}>
              <td>{oi.item.nome}</td>
              <td>{CATEGORIA_LABELS[oi.item.categoria]}</td>
              <td>{oi.item.descricao}</td>
            </tr>
          ))}
          {orcamento.itens.length === 0 && (
            <tr>
              <td colSpan={3}>Nenhum item solicitado.</td>
            </tr>
          )}
        </tbody>
      </table>

      {!jaRespondido && (
        <>
          <h2>Decisão</h2>
          <form onSubmit={handleSubmit((data) => setPendingStatus(data))} noValidate>
            <div className="form-field">
              <label htmlFor="status">Decisão</label>
              <select id="status" {...register("status")}>
                <option value="EM_ANALISE">Marcar em análise</option>
                <option value="AGUARDANDO_ACEITE_CLIENTE">Aguardar Aceite do Cliente</option>
                <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                <option value="APROVADO">Aprovar</option>
                <option value="RECUSADO">Recusar</option>
              </select>
            </div>
            <FormField
              label="Valor do evento (R$)"
              type="number"
              step="0.01"
              min={0}
              {...register("valorTotal")}
              error={errors.valorTotal?.message}
            />
            <button className="btn" type="submit" disabled={submitting}>
              Salvar decisão
            </button>
          </form>
        </>
      )}

      <ConfirmDialog
        open={pendingStatus !== null}
        title="Confirmar decisão"
        message={pendingStatus ? confirmMessage(pendingStatus) : ""}
        onConfirm={() => {
          if (pendingStatus) return guardedAction(pendingStatus);
        }}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
