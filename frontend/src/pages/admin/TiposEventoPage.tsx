import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TipoEvento,
  createTipoEvento,
  deactivateTipoEvento,
  listTiposEvento,
  updateTipoEvento,
} from "../../services/tiposEvento.service";
import { FormField } from "../../components/FormField";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { ApiError } from "../../services/api";

const tipoEventoSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  descricao: z.string().min(1, "Informe a descrição"),
});

type TipoEventoForm = z.infer<typeof tipoEventoSchema>;

export function TiposEventoPage() {
  const [tipos, setTipos] = useState<TipoEvento[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toDeactivate, setToDeactivate] = useState<TipoEvento | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TipoEventoForm>({ resolver: zodResolver(tipoEventoSchema) });

  async function reload() {
    setTipos(await listTiposEvento());
  }

  useEffect(() => {
    reload().catch(() => setApiError("Não foi possível carregar os tipos de evento."));
  }, []);

  const { submitting, guardedAction } = useSubmitGuard(async (data: TipoEventoForm) => {
    setApiError(null);
    try {
      await createTipoEvento(data);
      reset();
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível criar o tipo de evento.");
    }
  });

  async function reactivate(tipo: TipoEvento) {
    try {
      await updateTipoEvento(tipo.id, { ativo: true });
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível reativar o tipo de evento.");
    }
  }

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    try {
      await deactivateTipoEvento(toDeactivate.id);
      setToDeactivate(null);
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível desativar o tipo de evento.");
      setToDeactivate(null);
    }
  }

  return (
    <div>
      <h1>Tipos de evento</h1>
      {apiError && <p className="toast-error">{apiError}</p>}

      <form onSubmit={handleSubmit(guardedAction)} noValidate>
        <FormField label="Nome" {...register("nome")} error={errors.nome?.message} />
        <FormField label="Descrição" {...register("descricao")} error={errors.descricao?.message} />
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Salvando…" : "Adicionar tipo de evento"}
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tipos.map((tipo) => (
            <tr key={tipo.id}>
              <td>{tipo.nome}</td>
              <td>{tipo.descricao}</td>
              <td>{tipo.ativo ? "Ativo" : "Inativo"}</td>
              <td>
                {tipo.ativo ? (
                  <button className="btn btn-danger" onClick={() => setToDeactivate(tipo)}>
                    Desativar
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={() => reactivate(tipo)}>
                    Reativar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={toDeactivate !== null}
        title="Desativar tipo de evento"
        message={`Tem certeza que deseja desativar "${toDeactivate?.nome}"? Ele deixará de aparecer para novos pedidos, mas orçamentos já feitos continuam intactos.`}
        onConfirm={confirmDeactivate}
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}
