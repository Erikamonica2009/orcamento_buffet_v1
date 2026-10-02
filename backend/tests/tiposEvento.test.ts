import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { createClienteRecord } from "../src/repositories/clientes.repository";

const ADMIN_EMAIL = "tipos-test-admin@buffet.com";
const CLIENTE_EMAIL = "tipos-test-cliente@buffet.com";
const SENHA = "senha-correta-123";

let adminAgent: ReturnType<typeof request.agent>;
let clienteAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const senhaHash = await bcrypt.hash(SENHA, 10);
  await prisma.admin.create({ data: { nome: "Admin Teste", email: ADMIN_EMAIL, senhaHash } });
  await createClienteRecord({
    nome: "Cliente Teste",
    email: CLIENTE_EMAIL,
    senhaHash,
    telefone: "11999990000",
    cpf: "12111111139",
  });

  adminAgent = request.agent(app);
  await adminAgent.post("/auth/admin/login").send({ email: ADMIN_EMAIL, senha: SENHA });

  clienteAgent = request.agent(app);
  await clienteAgent.post("/auth/cliente/login").send({ email: CLIENTE_EMAIL, senha: SENHA });
});

afterAll(async () => {
  await prisma.admin.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.cliente.deleteMany({ where: { email: CLIENTE_EMAIL } });
  await prisma.tipoEvento.deleteMany({ where: { nome: { contains: "Tipo Teste" } } });
  await prisma.$disconnect();
});

describe("Tipos de evento CRUD", () => {
  let createdId: number;

  it("lets an admin create a tipo de evento", async () => {
    const res = await adminAgent
      .post("/tipos-evento")
      .send({ nome: "Tipo Teste Casamento", descricao: "Festa de casamento" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: "Tipo Teste Casamento", ativo: true });
    createdId = res.body.id;
  });

  it("rejects creation from a cliente", async () => {
    const res = await clienteAgent
      .post("/tipos-evento")
      .send({ nome: "Tipo Teste Proibido", descricao: "x" });
    expect(res.status).toBe(403);
  });

  it("lets both roles list, but hides inactive types from clientes", async () => {
    await adminAgent.put(`/tipos-evento/${createdId}`).send({ ativo: false });

    const adminList = await adminAgent.get("/tipos-evento");
    expect(adminList.body.some((t: { id: number }) => t.id === createdId)).toBe(true);

    const clienteList = await clienteAgent.get("/tipos-evento");
    expect(clienteList.body.some((t: { id: number }) => t.id === createdId)).toBe(false);
  });

  it("deactivates (soft-delete) via DELETE, keeping the row", async () => {
    const createRes = await adminAgent
      .post("/tipos-evento")
      .send({ nome: "Tipo Teste Aniversário", descricao: "Festa" });
    const id = createRes.body.id;

    const deleteRes = await adminAgent.delete(`/tipos-evento/${id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.ativo).toBe(false);

    const stillExists = await prisma.tipoEvento.findUnique({ where: { id } });
    expect(stillExists).not.toBeNull();
  });
});
