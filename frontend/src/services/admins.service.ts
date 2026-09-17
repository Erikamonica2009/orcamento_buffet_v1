import { api } from "./api";

export interface Admin {
  id: number;
  nome: string;
  email: string;
  createdAt: string;
}

export interface AdminInput {
  nome: string;
  email: string;
  senha: string;
}

export function listAdmins() {
  return api.get<Admin[]>("/admins");
}

export function createAdmin(input: AdminInput) {
  return api.post<Admin>("/admins", input);
}

export function deleteAdmin(id: number) {
  return api.delete<void>(`/admins/${id}`);
}
