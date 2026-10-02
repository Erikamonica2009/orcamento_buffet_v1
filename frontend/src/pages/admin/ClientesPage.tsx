import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Cliente,
  deactivateCliente,
  listClientes,
  registerCliente,
  updateCliente,
} from "../../services/clientes.service";
import { FormField } from "../../components/FormField";
import { FormModal } from "../../components/FormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { ApiError } from "../../services/api";
import { sanitizeText } from "../../utils/sanitize";
import { isValidCpf, maskCpf, maskTelefone, unmask } from "../../utils/masks";
import { SENHA_DICA, senhaSchema } from "../../utils/passwordPolicy";

const clienteSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  // Vazio = manter a senha atual (na edição); preenchida, segue a política de senha.
  senha: z.union([z.string().length(0), senhaSchema]),
  telefone: z
    .string()
    .transform(unmask)
    .refine((v) => v.length === 0 || (v.length >= 10 && v.length <= 11), "Informe um telefone válido"),
  cpf: z
    .string()
    .transform(unmask)
    .refine((v) => v.length === 0 || /^\d{11}$/.test(v), "CPF deve conter 11 dígitos")
    .refine((v) => v.length === 0 || isValidCpf(v), "CPF inválido"),
});

type ClienteForm = z.infer<typeof clienteSchema>;

const EMPTY_FORM: ClienteForm = { nome: "", email: "", senha: "", telefone: "", cpf: "" };

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Cliente | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteForm>({ resolver: zodResolver(clienteSchema), defaultValues: EMPTY_FORM });

  async function reload() {
    setClientes(await listClientes());
  }

  useEffect(() => {
    reload().catch(() => setApiError("Não foi possível carregar os clientes."));
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (searchTerm === null) return [];
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.email.toLowerCase().includes(termo) ||
        cliente.cpf.includes(termo)
    );
  }, [clientes, searchTerm]);

  function openCreate() {
    setEditingId(null);
    setApiError(null);
    reset(EMPTY_FORM);
    setModalOpen(true);
  }

  function startEdit(cliente: Cliente) {
    setEditingId(cliente.id);
    setEditing(cliente);
    setApiError(null);
    // CPF e telefone chegam mascarados da API (data masking no backend): o formulário começa
    // vazio e só envia esses campos se o admin digitar um valor novo.
    reset({ nome: cliente.nome, email: cliente.email, senha: "", telefone: "", cpf: "" });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setEditing(null);
    reset(EMPTY_FORM);
  }

  const { submitting, guardedAction } = useSubmitGuard(async (data: ClienteForm) => {
    setApiError(null);
    if (!editingId && (!data.senha || !data.telefone || !data.cpf)) {
      setApiError("Informe senha, telefone e CPF");
      return;
    }
    try {
      if (editingId) {
        const { senha, telefone, cpf, ...rest } = data;
        await updateCliente(editingId, {
          ...rest,
          ...(senha && { senha }),
          ...(telefone && { telefone }),
          ...(cpf && { cpf }),
        });
      } else {
        await registerCliente(data);
      }
      closeModal();
      await reload();
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : `Não foi possível ${editingId ? "salvar" : "criar"} o cliente.`
      );
    }
  });

  async function reactivate(cliente: Cliente) {
    try {
      await updateCliente(cliente.id, { ativo: true });
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível reativar o cliente.");
    }
  }

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    try {
      await deactivateCliente(toDeactivate.id);
      setToDeactivate(null);
      await reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível desativar o cliente.");
      setToDeactivate(null);
    }
  }

  return (
    <div>
      <div className="page-toolbar">
        <h1>Clientes</h1>
        <button className="btn" type="button" onClick={openCreate}>
          Novo cliente
        </button>
      </div>
      <p className="hint">Clientes também podem se cadastrar por conta própria pela tela de cadastro.</p>
      {apiError && <p className="toast-error">{apiError}</p>}

      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchTerm(search);
        }}
      >
        <div className="form-field">
          <label htmlFor="busca-clientes">Buscar</label>
          <input
            id="busca-clientes"
            type="search"
            placeholder="Buscar por nome, e-mail ou CPF"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn" type="submit">
          Buscar
        </button>
      </form>

      {searchTerm === null ? (
        <p className="hint">Use a busca acima para listar os clientes cadastrados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((cliente) => (
              <tr key={cliente.id}>
                <td>{sanitizeText(cliente.nome)}</td>
                <td>{cliente.email}</td>
                <td>{cliente.telefone}</td>
                <td>{cliente.cpf}</td>
                <td>{cliente.ativo ? "Ativo" : "Inativo"}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => startEdit(cliente)}>
                    Editar
                  </button>{" "}
                  {cliente.ativo ? (
                    <button className="btn btn-danger" onClick={() => setToDeactivate(cliente)}>
                      Desativar
                    </button>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => reactivate(cliente)}>
                      Reativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={6}>Nenhum cliente encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <FormModal open={modalOpen} title={editingId ? "Editar cliente" : "Novo cliente"} onClose={closeModal}>
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
          <Controller
            control={control}
            name="telefone"
            render={({ field }) => (
              <FormField
                label={editing ? `Novo telefone (atual: ${editing.telefone} — em branco mantém)` : "Telefone"}
                id="telefone"
                name="telefone"
                inputMode="numeric"
                placeholder="(11) 99999-0000"
                value={maskTelefone(field.value ?? "")}
                onChange={(e) => field.onChange(maskTelefone(e.target.value))}
                error={errors.telefone?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="cpf"
            render={({ field }) => (
              <FormField
                label={editing ? `Novo CPF (atual: ${editing.cpf} — em branco mantém)` : "CPF"}
                id="cpf"
                name="cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={maskCpf(field.value ?? "")}
                onChange={(e) => field.onChange(maskCpf(e.target.value))}
                error={errors.cpf?.message}
              />
            )}
          />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar cliente"}
          </button>{" "}
          <button className="btn btn-secondary" type="button" onClick={closeModal}>
            Cancelar
          </button>
        </form>
      </FormModal>

      <ConfirmDialog
        open={toDeactivate !== null}
        title="Desativar cliente"
        message={`Tem certeza que deseja desativar "${toDeactivate?.nome}"? O cliente não conseguirá mais entrar no sistema, mas o histórico de orçamentos é preservado.`}
        onConfirm={confirmDeactivate}
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}
