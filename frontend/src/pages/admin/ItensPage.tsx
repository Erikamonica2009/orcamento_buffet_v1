import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CATEGORIA_LABELS,
  Item,
  ItemCategoria,
  createItem,
  deactivateItem,
  listItens,
  updateItem,
} from "../../services/itens.service";
import { FormField } from "../../components/FormField";
import { FormModal } from "../../components/FormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { ApiError } from "../../services/api";

const CATEGORIAS: ItemCategoria[] = ["COMIDA", "BEBIDA", "DECORACAO", "ESTRUTURA", "ENTRETENIMENTO"];

const itemSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  descricao: z.string().min(1, "Informe a descrição"),
  categoria: z.enum(["COMIDA", "BEBIDA", "DECORACAO", "ESTRUTURA", "ENTRETENIMENTO"]),
});

type ItemForm = z.infer<typeof itemSchema>;

const EMPTY_FORM: ItemForm = { nome: "", descricao: "", categoria: "COMIDA" };

export function ItensPage() {
  const [itens, setItens] = useState<Item[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Item | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemForm>({ resolver: zodResolver(itemSchema), defaultValues: EMPTY_FORM });

  async function reload() {
    setItens(await listItens());
  }

  useEffect(() => {
    reload().catch(() => setApiError("Não foi possível carregar os itens."));
  }, []);

  const itensFiltrados = useMemo(() => {
    if (searchTerm === null) return [];
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter(
      (item) =>
        item.nome.toLowerCase().includes(termo) ||
        item.descricao.toLowerCase().includes(termo) ||
        CATEGORIA_LABELS[item.categoria].toLowerCase().includes(termo)
    );
  }, [itens, searchTerm]);

  function openCreate() {
    setEditingId(null);
    setApiError(null);
    reset(EMPTY_FORM);
    setModalOpen(true);
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setApiError(null);
    reset({ nome: item.nome, descricao: item.descricao, categoria: item.categoria });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    reset(EMPTY_FORM);
  }

  const { submitting, guardedAction } = useSubmitGuard(async (data: ItemForm) => {
    setApiError(null);
    try {
      if (editingId) {
        await updateItem(editingId, data);
      } else {
        await createItem(data);
      }
      closeModal();
      await reload();
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : `Não foi possível ${editingId ? "salvar" : "criar"} o item.`
      );
    }
  });

  async function reactivate(item: Item) {
    try {
      await updateItem(item.id, { ativo: true });
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível reativar o item.");
    }
  }

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    try {
      await deactivateItem(toDeactivate.id);
      setToDeactivate(null);
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível desativar o item.");
      setToDeactivate(null);
    }
  }

  return (
    <div>
      <div className="page-toolbar">
        <h1>Itens</h1>
        <button className="btn" type="button" onClick={openCreate}>
          Novo item
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
          <label htmlFor="busca-itens">Buscar</label>
          <input
            id="busca-itens"
            type="search"
            placeholder="Buscar por nome, descrição ou categoria"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn" type="submit">
          Buscar
        </button>
      </form>

      {searchTerm === null ? (
        <p className="hint">Use a busca acima para listar os itens cadastrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itensFiltrados.map((item) => (
              <tr key={item.id}>
                <td>{item.nome}</td>
                <td>{CATEGORIA_LABELS[item.categoria]}</td>
                <td>{item.ativo ? "Ativo" : "Inativo"}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => startEdit(item)}>
                    Editar
                  </button>{" "}
                  {item.ativo ? (
                    <button className="btn btn-danger" onClick={() => setToDeactivate(item)}>
                      Desativar
                    </button>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => reactivate(item)}>
                      Reativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {itensFiltrados.length === 0 && (
              <tr>
                <td colSpan={4}>Nenhum item encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <FormModal open={modalOpen} title={editingId ? "Editar item" : "Novo item"} onClose={closeModal}>
        <form onSubmit={handleSubmit(guardedAction)} noValidate>
          <FormField label="Nome" {...register("nome")} error={errors.nome?.message} />
          <FormField label="Descrição" {...register("descricao")} error={errors.descricao?.message} />
          <div className="form-field">
            <label htmlFor="categoria">Categoria</label>
            <select id="categoria" {...register("categoria")}>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {CATEGORIA_LABELS[categoria]}
                </option>
              ))}
            </select>
            {errors.categoria && <p className="field-error">{errors.categoria.message}</p>}
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar item"}
          </button>{" "}
          <button className="btn btn-secondary" type="button" onClick={closeModal}>
            Cancelar
          </button>
        </form>
      </FormModal>

      <ConfirmDialog
        open={toDeactivate !== null}
        title="Desativar item"
        message={`Tem certeza que deseja desativar "${toDeactivate?.nome}"?`}
        onConfirm={confirmDeactivate}
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}
