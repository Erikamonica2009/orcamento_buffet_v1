import { OrcamentoStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { decrypt } from "../utils/crypto";

const includeFull = {
  cliente: { select: { id: true, nome: true, email: true, telefone: true } },
  tipoEvento: true,
  itens: { include: { item: true } },
} as const;

// O telefone do cliente é armazenado cifrado; decifra antes de sair da camada de dados.
function decryptClienteTelefone<T extends { cliente: { telefone: string } }>(orcamento: T): T {
  return { ...orcamento, cliente: { ...orcamento.cliente, telefone: decrypt(orcamento.cliente.telefone) } };
}

export async function findOrcamentosByCliente(clienteId: number) {
  const orcamentos = await prisma.orcamento.findMany({
    where: { clienteId },
    include: includeFull,
    orderBy: { id: "desc" },
  });
  return orcamentos.map(decryptClienteTelefone);
}

export async function findAllOrcamentos(status?: OrcamentoStatus) {
  const orcamentos = await prisma.orcamento.findMany({
    where: status ? { status } : undefined,
    include: includeFull,
    orderBy: { id: "desc" },
  });
  return orcamentos.map(decryptClienteTelefone);
}

export async function findOrcamentoById(id: number) {
  const orcamento = await prisma.orcamento.findUnique({ where: { id }, include: includeFull });
  return orcamento ? decryptClienteTelefone(orcamento) : null;
}

export async function createOrcamentoRecord(data: {
  clienteId: number;
  tipoEventoId: number;
  dataEvento: Date;
  numConvidados: number;
  observacoes?: string;
  itensIds: number[];
}) {
  const orcamento = await prisma.orcamento.create({
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
  return decryptClienteTelefone(orcamento);
}

export async function updateOrcamentoStatusRecord(
  id: number,
  data: {
    status: OrcamentoStatus;
    valorTotal?: number;
    respondidoPorId: number | null;
    respondidoEm: Date | null;
  }
) {
  const orcamento = await prisma.orcamento.update({ where: { id }, data, include: includeFull });
  return decryptClienteTelefone(orcamento);
}
