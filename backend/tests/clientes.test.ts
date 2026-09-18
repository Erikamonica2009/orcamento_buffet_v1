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
      cpf: "10000000108",
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

  it("rejects a CPF with 11 digits but an invalid check digit with 400", async () => {
    const res = await request(app).post("/clientes").send({
      nome: "Cliente CPF Falso",
      email: "clientes-test-cpf-falso@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "12345678901",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a CPF made of repeated digits with 400", async () => {
    const res = await request(app).post("/clientes").send({
      nome: "Cliente CPF Repetido",
      email: "clientes-test-cpf-repetido@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "11111111111",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    const res = await request(app).post("/clientes").send({
      nome: "Duplicado",
      email: "clientes-test-novo@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "21111111200",
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

describe("PUT/DELETE /clientes/:id (admin only)", () => {
  it("rejects unauthenticated access", async () => {
    const res = await request(app).put("/clientes/1").send({ nome: "x" });
    expect(res.status).toBe(401);
  });

  it("updates a cliente's data without ever leaking senhaHash", async () => {
    const createRes = await request(app).post("/clientes").send({
      nome: "Cliente Editar",
      email: "clientes-test-editar@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "32222222311",
    });
    const id = createRes.body.id;

    const updateRes = await agent.put(`/clientes/${id}`).send({ nome: "Cliente Renomeado" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.nome).toBe("Cliente Renomeado");
    expect(updateRes.body.senhaHash).toBeUndefined();
  });

  it("rejects updating a cliente's email to one already in use with 409", async () => {
    const createRes = await request(app).post("/clientes").send({
      nome: "Cliente Conflito",
      email: "clientes-test-conflito@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "43333333422",
    });
    const id = createRes.body.id;

    const res = await agent.put(`/clientes/${id}`).send({ email: "clientes-test-novo@buffet.com" });
    expect(res.status).toBe(409);
  });

  it("deactivates a cliente, blocking their login, and reactivates it by setting ativo back to true", async () => {
    const createRes = await request(app).post("/clientes").send({
      nome: "Cliente Desativar",
      email: "clientes-test-desativar@buffet.com",
      senha: "senha123456",
      telefone: "11988887777",
      cpf: "54444444533",
    });
    const id = createRes.body.id;

    const deactivateRes = await agent.delete(`/clientes/${id}`);
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.ativo).toBe(false);

    const loginBlockedRes = await request(app)
      .post("/auth/cliente/login")
      .send({ email: "clientes-test-desativar@buffet.com", senha: "senha123456" });
    expect(loginBlockedRes.status).toBe(401);

    const reactivateRes = await agent.put(`/clientes/${id}`).send({ ativo: true });
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.ativo).toBe(true);

    const loginOkRes = await request(app)
      .post("/auth/cliente/login")
      .send({ email: "clientes-test-desativar@buffet.com", senha: "senha123456" });
    expect(loginOkRes.status).toBe(200);
  });
});
