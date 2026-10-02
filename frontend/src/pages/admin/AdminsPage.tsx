import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Admin, createAdmin, deleteAdmin, listAdmins, updateAdmin } from "../../services/admins.service";
import { FormField } from "../../components/FormField";
import { FormModal } from "../../components/FormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { ApiError } from "../../services/api";
import { SENHA_DICA, senhaSchema } from "../../utils/passwordPolicy";

const adminSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  // Vazio = manter a senha atual (na edição); preenchida, segue a política de senha.
  senha: z.union([z.string().length(0), senhaSchema]),
});

type AdminForm = z.infer<typeof adminSchema>;

const EMPTY_FORM: AdminForm = { nome: "", email: "", senha: "" };

export function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Admin | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminForm>({ resolver: zodResolver(adminSchema), defaultValues: EMPTY_FORM });

  async function reload() {
    setAdmins(await listAdmins());
  }

  useEffect(() => {
    reload().catch(() => setApiError("Não foi possível carregar os administradores."));
  }, []);

  const adminsFiltrados = useMemo(() => {
    if (searchTerm === null) return [];
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return admins;
    return admins.filter(
      (admin) => admin.nome.toLowerCase().includes(termo) || admin.email.toLowerCase().includes(termo)
    );
  }, [admins, searchTerm]);

  function openCreate() {
    setEditingId(null);
    setApiError(null);
    reset(EMPTY_FORM);
    setModalOpen(true);
  }

  function startEdit(admin: Admin) {
    setEditingId(admin.id);
    setApiError(null);
    reset({ nome: admin.nome, email: admin.email, senha: "" });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    reset(EMPTY_FORM);
  }

  const { submitting, guardedAction } = useSubmitGuard(async (data: AdminForm) => {
    setApiError(null);
    if (!editingId && !data.senha) {
      setApiError("Informe a senha");
      return;
    }
    try {
      if (editingId) {
        const { senha, ...rest } = data;
        await updateAdmin(editingId, senha ? { ...rest, senha } : rest);
      } else {
        await createAdmin(data);
      }
      closeModal();
      await reload();
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : `Não foi possível ${editingId ? "salvar" : "criar"} o administrador.`
      );
    }
  });

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteAdmin(toDelete.id);
      setToDelete(null);
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível excluir o administrador.");
      setToDelete(null);
    }
  }

  return (
    <div>
      <div className="page-toolbar">
        <h1>Administradores</h1>
        <button className="btn" type="button" onClick={openCreate}>
          Novo administrador
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
          <label htmlFor="busca-admins">Buscar</label>
          <input
            id="busca-admins"
            type="search"
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn" type="submit">
          Buscar
        </button>
      </form>

      {searchTerm === null ? (
        <p className="hint">Use a busca acima para listar os administradores cadastrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {adminsFiltrados.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.nome}</td>
                <td>{admin.email}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => startEdit(admin)}>
                    Editar
                  </button>{" "}
                  <button className="btn btn-danger" onClick={() => setToDelete(admin)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {adminsFiltrados.length === 0 && (
              <tr>
                <td colSpan={3}>Nenhum administrador encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <FormModal
        open={modalOpen}
        title={editingId ? "Editar administrador" : "Novo administrador"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit(guardedAction)} noValidate>
          <FormField label="Nome" {...register("nome")} error={errors.nome?.message} />
          <FormField label="E-mail" type="email" {...register("email")} error={errors.email?.message} />
          <FormField
            label={editingId ? "Nova senha (deixe em branco para manter)" : "Senha"}
            type="password"
            autoComplete="new-password"
            hint={SENHA_DICA}
            {...register("senha")}
            error={errors.senha?.message}
          />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar administrador"}
          </button>{" "}
          <button className="btn btn-secondary" type="button" onClick={closeModal}>
            Cancelar
          </button>
        </form>
      </FormModal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir administrador"
        message={`Tem certeza que deseja excluir ${toDelete?.nome}? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
