import { api } from "./api";

export type OrcamentoStatus =
  | "PENDENTE"
  | "EM_ANALISE"
  | "AGUARDANDO_ACEITE_CLIENTE"
  | "AGUARDANDO_PAGAMENTO"
  | "APROVADO"
  | "RECUSADO";

export interface Orcamento {
  id: number;
  clienteId: number;
  cliente: { id: number; nome: string; email: string; telefone: string };
  tipoEventoId: number;
  tipoEvento: { id: number; nome: string; descricao: string };
  dataEvento: string;
  numConvidados: number;
  observacoes: string | null;
  status: OrcamentoStatus;
  valorTotal: string | null;
  createdAt: string;
  itens: { item: { id: number; nome: string; descricao: string; categoria: ItemCategoriaLike } }[];
}

type ItemCategoriaLike = "COMIDA" | "BEBIDA" | "DECORACAO" | "ESTRUTURA" | "ENTRETENIMENTO";

export interface CreateOrcamentoInput {
  tipoEventoId: number;
  dataEvento: string;
  numConvidados: number;
  observacoes?: string;
  itensIds: number[];
}

export interface UpdateOrcamentoStatusInput {
  status: Extract<
    OrcamentoStatus,
    "EM_ANALISE" | "AGUARDANDO_ACEITE_CLIENTE" | "AGUARDANDO_PAGAMENTO" | "APROVADO" | "RECUSADO"
  >;
  valorTotal?: number;
}

export function createOrcamento(input: CreateOrcamentoInput) {
  return api.post<Orcamento>("/orcamentos", input);
}

export function listMeusOrcamentos() {
  return api.get<Orcamento[]>("/orcamentos");
}

export function listOrcamentos(status?: OrcamentoStatus) {
  const query = status ? `?status=${status}` : "";
  return api.get<Orcamento[]>(`/orcamentos${query}`);
}

export function getOrcamento(id: number) {
  return api.get<Orcamento>(`/orcamentos/${id}`);
}

export function updateOrcamentoStatus(id: number, input: UpdateOrcamentoStatusInput) {
  return api.patch<Orcamento>(`/orcamentos/${id}`, input);
}

export function responderAceiteCliente(id: number, aceitar: boolean) {
  return api.patch<Orcamento>(`/orcamentos/${id}/aceite`, { aceitar });
}

export const STATUS_LABELS: Record<OrcamentoStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  AGUARDANDO_ACEITE_CLIENTE: "Aguardando aceite do cliente",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
};
