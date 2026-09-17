import { api } from "./api";

export interface TipoEvento {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export interface TipoEventoInput {
  nome: string;
  descricao: string;
}

export function listTiposEvento() {
  return api.get<TipoEvento[]>("/tipos-evento");
}

export function createTipoEvento(input: TipoEventoInput) {
  return api.post<TipoEvento>("/tipos-evento", input);
}

export function updateTipoEvento(id: number, input: Partial<TipoEventoInput & { ativo: boolean }>) {
  return api.put<TipoEvento>(`/tipos-evento/${id}`, input);
}

export function deactivateTipoEvento(id: number) {
  return api.delete<TipoEvento>(`/tipos-evento/${id}`);
}
