import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../middlewares/AppError";
import { Role } from "../middlewares/auth";
import { findAdminById } from "../repositories/admins.repository";
import { findClienteById } from "../repositories/clientes.repository";
import { DUMMY_HASH, hashPassword, needsRehash, verifyPassword } from "../utils/password";

const TOKEN_TTL = "8h";

function issueToken(id: number, role: Role) {
  return jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

export async function loginAdmin(email: string, senha: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  const senhaOk = await verifyPassword(senha, admin?.senhaHash ?? DUMMY_HASH);

  if (!admin || !senhaOk) {
    throw new AppError(401, "Credenciais inválidas");
  }
  if (needsRehash(admin.senhaHash)) {
    await prisma.admin.update({ where: { id: admin.id }, data: { senhaHash: await hashPassword(senha) } });
  }

  const token = issueToken(admin.id, "admin");
  return { token, admin: { id: admin.id, nome: admin.nome, email: admin.email } };
}

export async function loginCliente(email: string, senha: string) {
  const cliente = await prisma.cliente.findUnique({ where: { email } });
  const senhaOk = await verifyPassword(senha, cliente?.senhaHash ?? DUMMY_HASH);

  if (!cliente || !senhaOk || !cliente.ativo) {
    throw new AppError(401, "Credenciais inválidas");
  }
  if (needsRehash(cliente.senhaHash)) {
    await prisma.cliente.update({ where: { id: cliente.id }, data: { senhaHash: await hashPassword(senha) } });
  }

  const token = issueToken(cliente.id, "cliente");
  return { token, cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email } };
}

export async function getAuthenticatedUser(id: number, role: Role) {
  if (role === "admin") {
    const admin = await findAdminById(id);
    if (!admin) {
      throw new AppError(401, "Sessão inválida ou expirada");
    }
    return { id: admin.id, nome: admin.nome, email: admin.email, role: "admin" as const };
  }

  const cliente = await findClienteById(id);
  if (!cliente || !cliente.ativo) {
    throw new AppError(401, "Sessão inválida ou expirada");
  }
  return { id: cliente.id, nome: cliente.nome, email: cliente.email, role: "cliente" as const };
}
