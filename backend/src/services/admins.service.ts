import bcrypt from "bcryptjs";
import { AppError } from "../middlewares/AppError";
import * as adminsRepo from "../repositories/admins.repository";
import { CreateAdminInput, UpdateAdminInput } from "../schemas/admins.schemas";

function toPublic(admin: { id: number; nome: string; email: string; createdAt: Date }) {
  return { id: admin.id, nome: admin.nome, email: admin.email, createdAt: admin.createdAt };
}

export async function listAdmins() {
  const admins = await adminsRepo.findAllAdmins();
  return admins.map(toPublic);
}

export async function getAdmin(id: number) {
  const admin = await adminsRepo.findAdminById(id);
  if (!admin) {
    throw new AppError(404, "Administrador não encontrado");
  }
  return toPublic(admin);
}

export async function createAdmin(input: CreateAdminInput) {
  const existing = await adminsRepo.findAdminByEmail(input.email);
  if (existing) {
    throw new AppError(409, "Já existe um administrador com este e-mail");
  }

  const senhaHash = await bcrypt.hash(input.senha, 10);
  const admin = await adminsRepo.createAdminRecord({ nome: input.nome, email: input.email, senhaHash });
  return toPublic(admin);
}

export async function updateAdmin(id: number, input: UpdateAdminInput) {
  await getAdmin(id);

  if (input.email !== undefined) {
    const existing = await adminsRepo.findAdminByEmail(input.email);
    if (existing && existing.id !== id) {
      throw new AppError(409, "Já existe um administrador com este e-mail");
    }
  }

  const data: { nome?: string; email?: string; senhaHash?: string } = {};
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.email !== undefined) data.email = input.email;
  if (input.senha !== undefined) data.senhaHash = await bcrypt.hash(input.senha, 10);

  const admin = await adminsRepo.updateAdminRecord(id, data);
  return toPublic(admin);
}

export async function deleteAdmin(id: number) {
  await getAdmin(id);
  await adminsRepo.deleteAdminRecord(id);
}
