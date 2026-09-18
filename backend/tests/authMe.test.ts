import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "auth-me-test-admin@buffet.com";
const CLIENTE_EMAIL = "auth-me-test-cliente@buffet.com";
const SENHA = "senha-correta-123";

beforeAll(async () => {
  const senhaHash = await bcrypt.hash(SENHA, 10);

  await prisma.admin.create({
    data: { nome: "Admin Teste", email: ADMIN_EMAIL, senhaHash },
  });

  await prisma.cliente.create({
    data: {
      nome: "Cliente Teste",
      email: CLIENTE_EMAIL,
      senhaHash,
      telefone: "11999990001",
      cpf: "65555555644",
    },
  });
});

afterAll(async () => {
  await prisma.admin.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.cliente.deleteMany({ where: { email: CLIENTE_EMAIL } });
  await prisma.$disconnect();
});

describe("GET /auth/me", () => {
  it("returns 401 when there is no session", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the admin's identity and role for a valid admin session", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/admin/login").send({ email: ADMIN_EMAIL, senha: SENHA });

    const res = await agent.get("/auth/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: expect.any(Number),
      nome: "Admin Teste",
      email: ADMIN_EMAIL,
      role: "admin",
    });
  });

  it("returns the cliente's identity and role for a valid cliente session", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/cliente/login").send({ email: CLIENTE_EMAIL, senha: SENHA });

    const res = await agent.get("/auth/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: expect.any(Number),
      nome: "Cliente Teste",
      email: CLIENTE_EMAIL,
      role: "cliente",
    });
  });
});
