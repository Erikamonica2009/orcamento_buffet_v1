import { api } from "./api";

export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  createdAt: string;
}

export interface RegisterClienteInput {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cpf: string;
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
