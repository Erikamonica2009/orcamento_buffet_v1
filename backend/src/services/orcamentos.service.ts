import { OrcamentoStatus } from "@prisma/client";
import { AppError } from "../middlewares/AppError";
import * as orcamentosRepo from "../repositories/orcamentos.repository";
import { findTipoEventoById } from "../repositories/tiposEvento.repository";
import { findItemById } from "../repositories/itens.repository";
import { CreateOrcamentoInput, UpdateOrcamentoStatusInput } from "../schemas/orcamentos.schemas";

export async function listOrcamentosForCliente(clienteId: number) {
  return orcamentosRepo.findOrcamentosByCliente(clienteId);
}

export async function listOrcamentosForAdmin(status?: OrcamentoStatus) {
  return orcamentosRepo.findAllOrcamentos(status);
}

async function getOrcamentoOrThrow(id: number) {
  const orcamento = await orcamentosRepo.findOrcamentoById(id);
  if (!orcamento) {
    throw new AppError(404, "Orçamento não encontrado");
  }
  return orcamento;
}

export async function getOrcamentoForCliente(id: number, clienteId: number) {
  const orcamento = await getOrcamentoOrThrow(id);
  if (orcamento.clienteId !== clienteId) {
    throw new AppError(403, "Acesso negado");
  }
  return orcamento;
}

export async function getOrcamentoForAdmin(id: number) {
  return getOrcamentoOrThrow(id);
}

export async function createOrcamento(clienteId: number, input: CreateOrcamentoInput) {
  const tipoEvento = await findTipoEventoById(input.tipoEventoId);
  if (!tipoEvento || !tipoEvento.ativo) {
    throw new AppError(400, "Tipo de evento inválido");
  }

  for (const itemId of input.itensIds) {
    const item = await findItemById(itemId);
    if (!item || !item.ativo) {
      throw new AppError(400, `Item inválido: ${itemId}`);
    }
  }

  return orcamentosRepo.createOrcamentoRecord({
    clienteId,
    tipoEventoId: input.tipoEventoId,
    dataEvento: input.dataEvento,
    numConvidados: input.numConvidados,
    observacoes: input.observacoes,
    itensIds: input.itensIds,
  });
}

export async function updateOrcamentoStatus(
  id: number,
  adminId: number,
  input: UpdateOrcamentoStatusInput
) {
  const orcamento = await getOrcamentoOrThrow(id);

  if (orcamento.status === "APROVADO" || orcamento.status === "RECUSADO") {
    throw new AppError(409, "Este orçamento já foi respondido e não pode ser alterado");
  }

  const isFinalDecision = input.status === "APROVADO" || input.status === "RECUSADO";

  return orcamentosRepo.updateOrcamentoStatusRecord(id, {
    status: input.status,
    valorTotal: input.valorTotal,
    respondidoPorId: isFinalDecision ? adminId : null,
    respondidoEm: isFinalDecision ? new Date() : null,
  });
}
