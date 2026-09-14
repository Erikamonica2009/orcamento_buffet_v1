import { OrcamentoStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

const includeFull = {
  cliente: { select: { id: true, nome: true, email: true, telefone: true } },
  tipoEvento: true,
  itens: { include: { item: true } },
} as const;

export function findOrcamentosByCliente(clienteId: number) {
  return prisma.orcamento.findMany({
    where: { clienteId },
    include: includeFull,
    orderBy: { id: "desc" },
  });
}

export function findAllOrcamentos(status?: OrcamentoStatus) {
  return prisma.orcamento.findMany({
    where: status ? { status } : undefined,
    include: includeFull,
    orderBy: { id: "desc" },
  });
}

export function findOrcamentoById(id: number) {
  return prisma.orcamento.findUnique({ where: { id }, include: includeFull });
}

export function createOrcamentoRecord(data: {
  clienteId: number;
  tipoEventoId: number;
  dataEvento: Date;
  numConvidados: number;
  observacoes?: string;
  itensIds: number[];
}) {
  return prisma.orcamento.create({
    data: {
      clienteId: data.clienteId,
      tipoEventoId: data.tipoEventoId,
      dataEvento: data.dataEvento,
      numConvidados: data.numConvidados,
      observacoes: data.observacoes,
      itens: {
        create: data.itensIds.map((itemId) => ({ itemId })),
      },
    },
    include: includeFull,
  });
}

export function updateOrcamentoStatusRecord(
  id: number,
  data: {
    status: OrcamentoStatus;
    valorTotal?: number;
    respondidoPorId: number | null;
    respondidoEm: Date | null;
  }
) {
  return prisma.orcamento.update({ where: { id }, data, include: includeFull });
}
