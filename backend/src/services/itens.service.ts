import { AppError } from "../middlewares/AppError";
import * as itensRepo from "../repositories/itens.repository";
import { CreateItemInput, UpdateItemInput } from "../schemas/itens.schemas";

export async function listItens(onlyActive: boolean) {
  return itensRepo.findAllItens(onlyActive);
}

export async function getItem(id: number) {
  const item = await itensRepo.findItemById(id);
  if (!item) {
    throw new AppError(404, "Item não encontrado");
  }
  return item;
}

export async function createItem(input: CreateItemInput) {
  return itensRepo.createItemRecord(input);
}

export async function updateItem(id: number, input: UpdateItemInput) {
  await getItem(id);
  return itensRepo.updateItemRecord(id, input);
}

export async function deactivateItem(id: number) {
  await getItem(id);
  return itensRepo.updateItemRecord(id, { ativo: false });
}
