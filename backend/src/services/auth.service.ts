import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../middlewares/AppError";
import { Role } from "../middlewares/auth";

const TOKEN_TTL = "8h";

function issueToken(id: number, role: Role) {
  return jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

export async function loginAdmin(email: string, senha: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const senhaOk = await bcrypt.compare(senha, admin.senhaHash);
  if (!senhaOk) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const token = issueToken(admin.id, "admin");
  return { token, admin: { id: admin.id, nome: admin.nome, email: admin.email } };
}

export async function loginCliente(email: string, senha: string) {
  const cliente = await prisma.cliente.findUnique({ where: { email } });
  if (!cliente) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const senhaOk = await bcrypt.compare(senha, cliente.senhaHash);
  if (!senhaOk) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const token = issueToken(cliente.id, "cliente");
  return { token, cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email } };
}
