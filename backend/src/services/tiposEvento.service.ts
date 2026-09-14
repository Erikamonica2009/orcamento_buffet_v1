import { AppError } from "../middlewares/AppError";
import * as tiposEventoRepo from "../repositories/tiposEvento.repository";
import { CreateTipoEventoInput, UpdateTipoEventoInput } from "../schemas/tiposEvento.schemas";

export async function listTiposEvento(onlyActive: boolean) {
  return tiposEventoRepo.findAllTiposEvento(onlyActive);
}

export async function getTipoEvento(id: number) {
  const tipoEvento = await tiposEventoRepo.findTipoEventoById(id);
  if (!tipoEvento) {
    throw new AppError(404, "Tipo de evento não encontrado");
  }
  return tipoEvento;
}

export async function createTipoEvento(input: CreateTipoEventoInput) {
  return tiposEventoRepo.createTipoEventoRecord(input);
}

export async function updateTipoEvento(id: number, input: UpdateTipoEventoInput) {
  await getTipoEvento(id);
  return tiposEventoRepo.updateTipoEventoRecord(id, input);
}

export async function deactivateTipoEvento(id: number) {
  await getTipoEvento(id);
  return tiposEventoRepo.updateTipoEventoRecord(id, { ativo: false });
}
