import { api } from "./api";

export type Role = "admin" | "cliente";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: Role;
}

export function loginAdmin(email: string, senha: string) {
  return api.post<{ id: number; nome: string; email: string }>("/auth/admin/login", { email, senha });
}

export function loginCliente(email: string, senha: string) {
  return api.post<{ id: number; nome: string; email: string }>("/auth/cliente/login", { email, senha });
}

export function logout() {
  return api.post<void>("/auth/logout");
}

export function fetchMe() {
  return api.get<AuthUser>("/auth/me");
}
