import { api } from "./api";

export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  ativo: boolean;
  createdAt: string;
}

export interface RegisterClienteInput {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cpf: string;
}

export interface UpdateClienteInput {
  nome?: string;
  email?: string;
  senha?: string;
  telefone?: string;
  cpf?: string;
  ativo?: boolean;
}

export function registerCliente(input: RegisterClienteInput) {
  return api.post<Cliente>("/clientes", input);
}

export function listClientes() {
  return api.get<Cliente[]>("/clientes");
}

export function getCliente(id: number) {
  return api.get<Cliente>(`/clientes/${id}`);
}

export function updateCliente(id: number, input: UpdateClienteInput) {
  return api.put<Cliente>(`/clientes/${id}`, input);
}

export function deactivateCliente(id: number) {
  return api.delete<Cliente>(`/clientes/${id}`);
}
