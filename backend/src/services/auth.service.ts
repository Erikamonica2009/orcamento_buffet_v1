import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../middlewares/AppError";
import { Role } from "../middlewares/auth";
import { findAdminById } from "../repositories/admins.repository";
import { findClienteById } from "../repositories/clientes.repository";

const TOKEN_TTL = "8h";

const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q9k5nAvVUOOFZOFZIYK1B5MnvcaGa";

function issueToken(id: number, role: Role) {
  return jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

export async function loginAdmin(email: string, senha: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  const senhaOk = await bcrypt.compare(senha, admin?.senhaHash ?? DUMMY_HASH);

  if (!admin || !senhaOk) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const token = issueToken(admin.id, "admin");
  return { token, admin: { id: admin.id, nome: admin.nome, email: admin.email } };
}

export async function loginCliente(email: string, senha: string) {
  const cliente = await prisma.cliente.findUnique({ where: { email } });
  const senhaOk = await bcrypt.compare(senha, cliente?.senhaHash ?? DUMMY_HASH);

  if (!cliente || !senhaOk || !cliente.ativo) {
    throw new AppError(401, "Credenciais inválidas");
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
