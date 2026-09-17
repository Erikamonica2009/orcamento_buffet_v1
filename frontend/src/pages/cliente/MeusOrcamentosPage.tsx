import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { listTiposEvento } from "../../services/tiposEvento.service";
import type { TipoEvento } from "../../services/tiposEvento.service";
import { listItens, CATEGORIA_LABELS } from "../../services/itens.service";
import type { Item } from "../../services/itens.service";
import { createOrcamento, listMeusOrcamentos, STATUS_LABELS } from "../../services/orcamentos.service";
import type { Orcamento } from "../../services/orcamentos.service";
import { sanitizeText } from "../../utils/sanitize";
import { ApiError } from "../../services/api";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { FormField } from "../../components/FormField";

const orcamentoSchema = z.object({
  tipoEventoId: z.coerce.number().int().positive("Selecione um tipo de evento"),
  dataEvento: z.string().min(1, "Informe a data do evento"),
  numConvidados: z.coerce.number().int().positive("Informe o número de convidados"),
  observacoes: z.string().max(500, "Máximo de 500 caracteres").optional(),
  itensIds: z.array(z.number()).min(1, "Selecione ao menos um item"),
});

type OrcamentoForm = z.infer<typeof orcamentoSchema>;

export function MeusOrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  async function reload() {
    const [meusOrcamentos, tipos, catalogo] = await Promise.all([
      listMeusOrcamentos(),
      listTiposEvento(),
      listItens(),
    ]);
    setOrcamentos(meusOrcamentos);
    setTiposEvento(tipos);
    setItens(catalogo);
  }

  useEffect(() => {
    reload()
      .catch(() => setApiError("Não foi possível carregar seus dados."))
      .finally(() => setLoading(false));
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrcamentoForm>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: { itensIds: [] },
  });

  const { submitting, guardedAction } = useSubmitGuard(async (data: OrcamentoForm) => {
    setApiError(null);
    try {
      await createOrcamento({ ...data, dataEvento: new Date(data.dataEvento).toISOString() });
      reset({ itensIds: [] });
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível enviar o pedido.");
    }
  });

  if (loading) return <p className="loading">Carregando…</p>;

  return (
    <div>
      <h1>Meus orçamentos</h1>
      {apiError && <p className="toast-error">{apiError}</p>}

      <section>
        <h2>Novo pedido</h2>
        <form onSubmit={handleSubmit(guardedAction)} noValidate>
          <div className="form-field">
            <label htmlFor="tipoEventoId">Tipo de evento</label>
            <select id="tipoEventoId" {...register("tipoEventoId")}>
              <option value="">Selecione…</option>
              {tiposEvento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
            {errors.tipoEventoId && <p className="field-error">{errors.tipoEventoId.message}</p>}
          </div>

          <FormField
            label="Data do evento"
            type="date"
            {...register("dataEvento")}
            error={errors.dataEvento?.message}
          />

          <FormField
            label="Número de convidados"
            type="number"
            min={1}
            {...register("numConvidados")}
            error={errors.numConvidados?.message}
          />

          <div className="form-field">
            <label htmlFor="observacoes">Observações</label>
            <textarea id="observacoes" maxLength={500} {...register("observacoes")} />
            {errors.observacoes && <p className="field-error">{errors.observacoes.message}</p>}
          </div>

          <div className="form-field">
            <label>Itens desejados</label>
            <Controller
              control={control}
              name="itensIds"
              render={({ field }) => (
                <div>
                  {itens.map((item) => (
                    <label key={item.id} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={field.value.includes(item.id)}
                        onChange={(e) => {
                          field.onChange(
                            e.target.checked
                              ? [...field.value, item.id]
                              : field.value.filter((id) => id !== item.id)
                          );
                        }}
                      />
                      {item.nome} ({CATEGORIA_LABELS[item.categoria]})
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.itensIds && <p className="field-error">{errors.itensIds.message}</p>}
          </div>

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Enviando…" : "Solicitar orçamento"}
          </button>
        </form>
      </section>

      <section>
        <h2>Pedidos anteriores</h2>
        <table>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Data</th>
              <th>Convidados</th>
              <th>Observações</th>
              <th>Status</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {orcamentos.map((orcamento) => (
              <tr key={orcamento.id}>
                <td>{orcamento.tipoEvento.nome}</td>
                <td>{new Date(orcamento.dataEvento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                <td>{orcamento.numConvidados}</td>
                <td>{sanitizeText(orcamento.observacoes ?? "")}</td>
                <td>{STATUS_LABELS[orcamento.status]}</td>
                <td>{orcamento.valorTotal ? `R$ ${orcamento.valorTotal}` : "—"}</td>
              </tr>
            ))}
            {orcamentos.length === 0 && (
              <tr>
                <td colSpan={6}>Nenhum pedido de orçamento ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
