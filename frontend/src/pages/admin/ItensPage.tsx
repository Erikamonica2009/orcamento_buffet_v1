import { useEffect, useState } from "react";
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

export function ItensPage() {
  const [itens, setItens] = useState<Item[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Item | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemForm>({ resolver: zodResolver(itemSchema) });

  async function reload() {
    setItens(await listItens());
  }

  useEffect(() => {
    reload().catch(() => setApiError("Não foi possível carregar os itens."));
  }, []);

  const { submitting, guardedAction } = useSubmitGuard(async (data: ItemForm) => {
    setApiError(null);
    try {
      await createItem(data);
      reset();
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível criar o item.");
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
      <h1>Itens</h1>
      {apiError && <p className="toast-error">{apiError}</p>}

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
          {submitting ? "Salvando…" : "Adicionar item"}
        </button>
      </form>

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
          {itens.map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{CATEGORIA_LABELS[item.categoria]}</td>
              <td>{item.ativo ? "Ativo" : "Inativo"}</td>
              <td>
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
        </tbody>
      </table>

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
