import { prisma } from "../config/prisma";

export function findAllAdmins() {
  return prisma.admin.findMany({ orderBy: { id: "asc" } });
}

export function findAdminById(id: number) {
  return prisma.admin.findUnique({ where: { id } });
}

export function findAdminByEmail(email: string) {
  return prisma.admin.findUnique({ where: { email } });
}

export function createAdminRecord(data: { nome: string; email: string; senhaHash: string }) {
  return prisma.admin.create({ data });
}

export function updateAdminRecord(
  id: number,
  data: Partial<{ nome: string; email: string; senhaHash: string }>
) {
  return prisma.admin.update({ where: { id }, data });
}

export function deleteAdminRecord(id: number) {
  return prisma.admin.delete({ where: { id } });
}
