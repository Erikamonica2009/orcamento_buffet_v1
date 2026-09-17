import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Admin, createAdmin, deleteAdmin, listAdmins } from "../../services/admins.service";
import { FormField } from "../../components/FormField";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { ApiError } from "../../services/api";

const adminSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

type AdminForm = z.infer<typeof adminSchema>;

export function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Admin | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminForm>({ resolver: zodResolver(adminSchema) });

  async function reload() {
    setAdmins(await listAdmins());
  }

  useEffect(() => {
    reload().catch(() => setApiError("Não foi possível carregar os administradores."));
  }, []);

  const { submitting, guardedAction } = useSubmitGuard(async (data: AdminForm) => {
    setApiError(null);
    try {
      await createAdmin(data);
      reset();
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível criar o administrador.");
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
      <h1>Administradores</h1>
      {apiError && <p className="toast-error">{apiError}</p>}

      <form onSubmit={handleSubmit(guardedAction)} noValidate>
        <FormField label="Nome" {...register("nome")} error={errors.nome?.message} />
        <FormField label="E-mail" type="email" {...register("email")} error={errors.email?.message} />
        <FormField label="Senha" type="password" {...register("senha")} error={errors.senha?.message} />
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Salvando…" : "Adicionar administrador"}
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.nome}</td>
              <td>{admin.email}</td>
              <td>
                <button className="btn btn-danger" onClick={() => setToDelete(admin)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
