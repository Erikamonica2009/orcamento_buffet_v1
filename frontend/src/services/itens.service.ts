import { api } from "./api";

export type ItemCategoria = "COMIDA" | "BEBIDA" | "DECORACAO" | "ESTRUTURA" | "ENTRETENIMENTO";

export interface Item {
  id: number;
  nome: string;
  descricao: string;
  categoria: ItemCategoria;
  ativo: boolean;
}

export interface ItemInput {
  nome: string;
  descricao: string;
  categoria: ItemCategoria;
}

export function listItens() {
  return api.get<Item[]>("/itens");
}

export function createItem(input: ItemInput) {
  return api.post<Item>("/itens", input);
}

export function updateItem(id: number, input: Partial<ItemInput & { ativo: boolean }>) {
  return api.put<Item>(`/itens/${id}`, input);
}

export function deactivateItem(id: number) {
  return api.delete<Item>(`/itens/${id}`);
}

export const CATEGORIA_LABELS: Record<ItemCategoria, string> = {
  COMIDA: "Comida",
  BEBIDA: "Bebida",
  DECORACAO: "Decoração",
  ESTRUTURA: "Estrutura",
  ENTRETENIMENTO: "Entretenimento",
};
