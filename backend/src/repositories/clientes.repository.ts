import { prisma } from "../config/prisma";

export function findAllClientes() {
  return prisma.cliente.findMany({ orderBy: { id: "asc" } });
}

export function findClienteById(id: number) {
  return prisma.cliente.findUnique({ where: { id } });
}

export function findClienteByEmail(email: string) {
  return prisma.cliente.findUnique({ where: { email } });
}

export function findClienteByCpf(cpf: string) {
  return prisma.cliente.findUnique({ where: { cpf } });
}

export function createClienteRecord(data: {
  nome: string;
  email: string;
  senhaHash: string;
  telefone: string;
  cpf: string;
}) {
  return prisma.cliente.create({ data });
}

export function updateClienteRecord(
  id: number,
  data: Partial<{ nome: string; email: string; senhaHash: string; telefone: string; cpf: string; ativo: boolean }>
) {
  return prisma.cliente.update({ where: { id }, data });
}
