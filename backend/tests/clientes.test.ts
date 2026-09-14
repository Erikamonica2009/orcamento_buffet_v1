import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "clientes-test-admin@buffet.com";
const SENHA = "senha-correta-123";

let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const senhaHash = await bcrypt.hash(SENHA, 10);
  await prisma.admin.create({ data: { nome: "Admin Teste", email: ADMIN_EMAIL, senhaHash } });
  agent = request.agent(app);
  await agent.post("/auth/admin/login").send({ email: ADMIN_EMAIL, senha: SENHA });
});

afterAll(async () => {
  await prisma.admin.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.cliente.deleteMany({ where: { email: { contains: "clientes-test" } } });
  await prisma.$disconnect();
});

describe("POST /clientes (public registration)", () => {
  it("registers a new cliente without requiring authentication", async () => {
    const res = await request(app).post("/clientes").send({
      nome: "Cliente Novo",
      email: "clientes-test-novo@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "22222222222",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: "Cliente Novo", email: "clientes-test-novo@buffet.com" });
    expect(res.body.senhaHash).toBeUndefined();
  });

  it("rejects an invalid CPF with 400", async () => {
    const res = await request(app).post("/clientes").send({
      nome: "Cliente Inválido",
      email: "clientes-test-invalido@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "123",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    const res = await request(app).post("/clientes").send({
      nome: "Duplicado",
      email: "clientes-test-novo@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "33333333333",
    });
    expect(res.status).toBe(409);
  });
});

describe("GET /clientes (admin only)", () => {
  it("rejects a cliente-role token with 403, not just an unauthenticated request", async () => {
    const clienteAgent = request.agent(app);
    await clienteAgent.post("/auth/cliente/login").send({
      email: "clientes-test-novo@buffet.com",
      senha: "senha123456",
    });
    const res = await clienteAgent.get("/clientes");
    expect(res.status).toBe(403);
  });

  it("lists clientes for an authenticated admin", async () => {
    const res = await agent.get("/clientes");
    expect(res.status).toBe(200);
    expect(
      res.body.some((c: { email: string }) => c.email === "clientes-test-novo@buffet.com")
    ).toBe(true);
  });
});
