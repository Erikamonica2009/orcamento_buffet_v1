import { prisma } from "../config/prisma";

export function findAllTiposEvento(onlyActive: boolean) {
  return prisma.tipoEvento.findMany({
    where: onlyActive ? { ativo: true } : undefined,
    orderBy: { id: "asc" },
  });
}

export function findTipoEventoById(id: number) {
  return prisma.tipoEvento.findUnique({ where: { id } });
}

export function createTipoEventoRecord(data: { nome: string; descricao: string }) {
  return prisma.tipoEvento.create({ data });
}

export function updateTipoEventoRecord(
  id: number,
  data: Partial<{ nome: string; descricao: string; ativo: boolean }>
) {
  return prisma.tipoEvento.update({ where: { id }, data });
}
