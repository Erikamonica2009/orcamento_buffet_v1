import { useEffect, useMemo, useState } from "react";
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
import { FormModal } from "../../components/FormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { ApiError } from "../../services/api";

const tipoEventoSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  descricao: z.string().min(1, "Informe a descrição"),
});

type TipoEventoForm = z.infer<typeof tipoEventoSchema>;

const EMPTY_FORM: TipoEventoForm = { nome: "", descricao: "" };

export function TiposEventoPage() {
  const [tipos, setTipos] = useState<TipoEvento[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toDeactivate, setToDeactivate] = useState<TipoEvento | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TipoEventoForm>({ resolver: zodResolver(tipoEventoSchema), defaultValues: EMPTY_FORM });

  async function reload() {
    setTipos(await listTiposEvento());
  }

  useEffect(() => {
    reload().catch(() => setApiError("Não foi possível carregar os tipos de evento."));
  }, []);

  const tiposFiltrados = useMemo(() => {
    if (searchTerm === null) return [];
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return tipos;
    return tipos.filter(
      (tipo) => tipo.nome.toLowerCase().includes(termo) || tipo.descricao.toLowerCase().includes(termo)
    );
  }, [tipos, searchTerm]);

  function openCreate() {
    setEditingId(null);
    setApiError(null);
    reset(EMPTY_FORM);
    setModalOpen(true);
  }

  function startEdit(tipo: TipoEvento) {
    setEditingId(tipo.id);
    setApiError(null);
    reset({ nome: tipo.nome, descricao: tipo.descricao });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    reset(EMPTY_FORM);
  }

  const { submitting, guardedAction } = useSubmitGuard(async (data: TipoEventoForm) => {
    setApiError(null);
    try {
      if (editingId) {
        await updateTipoEvento(editingId, data);
      } else {
        await createTipoEvento(data);
      }
      closeModal();
      await reload();
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : `Não foi possível ${editingId ? "salvar" : "criar"} o tipo de evento.`
      );
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
      <div className="page-toolbar">
        <h1>Tipos de evento</h1>
        <button className="btn" type="button" onClick={openCreate}>
          Novo tipo de evento
        </button>
      </div>
      {apiError && <p className="toast-error">{apiError}</p>}

      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchTerm(search);
        }}
      >
        <div className="form-field">
          <label htmlFor="busca-tipos-evento">Buscar</label>
          <input
            id="busca-tipos-evento"
            type="search"
            placeholder="Buscar por nome ou descrição"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn" type="submit">
          Buscar
        </button>
      </form>

      {searchTerm === null ? (
        <p className="hint">Use a busca acima para listar os tipos de evento cadastrados.</p>
      ) : (
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
            {tiposFiltrados.map((tipo) => (
              <tr key={tipo.id}>
                <td>{tipo.nome}</td>
                <td>{tipo.descricao}</td>
                <td>{tipo.ativo ? "Ativo" : "Inativo"}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => startEdit(tipo)}>
                    Editar
                  </button>{" "}
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
            {tiposFiltrados.length === 0 && (
              <tr>
                <td colSpan={4}>Nenhum tipo de evento encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <FormModal
        open={modalOpen}
        title={editingId ? "Editar tipo de evento" : "Novo tipo de evento"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit(guardedAction)} noValidate>
          <FormField label="Nome" {...register("nome")} error={errors.nome?.message} />
          <FormField label="Descrição" {...register("descricao")} error={errors.descricao?.message} />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar tipo de evento"}
          </button>{" "}
          <button className="btn btn-secondary" type="button" onClick={closeModal}>
            Cancelar
          </button>
        </form>
      </FormModal>

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
