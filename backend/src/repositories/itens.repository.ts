import { ItemCategoria } from "@prisma/client";
import { prisma } from "../config/prisma";

export function findAllItens(onlyActive: boolean) {
  return prisma.item.findMany({
    where: onlyActive ? { ativo: true } : undefined,
    orderBy: { id: "asc" },
  });
}

export function findItemById(id: number) {
  return prisma.item.findUnique({ where: { id } });
}

export function createItemRecord(data: { nome: string; descricao: string; categoria: ItemCategoria }) {
  return prisma.item.create({ data });
}

export function updateItemRecord(
  id: number,
  data: Partial<{ nome: string; descricao: string; categoria: ItemCategoria; ativo: boolean }>
) {
  return prisma.item.update({ where: { id }, data });
}
