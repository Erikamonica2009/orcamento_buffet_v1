import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "itens-test-admin@buffet.com";
const CLIENTE_EMAIL = "itens-test-cliente@buffet.com";
const SENHA = "senha-correta-123";

let adminAgent: ReturnType<typeof request.agent>;
let clienteAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const senhaHash = await bcrypt.hash(SENHA, 10);
  await prisma.admin.create({ data: { nome: "Admin Teste", email: ADMIN_EMAIL, senhaHash } });
  await prisma.cliente.create({
    data: {
      nome: "Cliente Teste",
      email: CLIENTE_EMAIL,
      senhaHash,
      telefone: "11999990000",
      cpf: "11000000036",
    },
  });

  adminAgent = request.agent(app);
  await adminAgent.post("/auth/admin/login").send({ email: ADMIN_EMAIL, senha: SENHA });

  clienteAgent = request.agent(app);
  await clienteAgent.post("/auth/cliente/login").send({ email: CLIENTE_EMAIL, senha: SENHA });
});

afterAll(async () => {
  await prisma.admin.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.cliente.deleteMany({ where: { email: CLIENTE_EMAIL } });
  await prisma.item.deleteMany({ where: { nome: { contains: "Item Teste" } } });
  await prisma.$disconnect();
});

describe("Itens CRUD", () => {
  let createdId: number;

  it("lets an admin create an item with a valid categoria", async () => {
    const res = await adminAgent
      .post("/itens")
      .send({ nome: "Item Teste Churrasco", descricao: "Churrasco completo", categoria: "COMIDA" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: "Item Teste Churrasco", categoria: "COMIDA", ativo: true });
    createdId = res.body.id;
  });

  it("rejects an invalid categoria with 400", async () => {
    const res = await adminAgent
      .post("/itens")
      .send({ nome: "Item Teste Inválido", descricao: "x", categoria: "SOBREMESA" });
    expect(res.status).toBe(400);
  });

  it("rejects creation from a cliente", async () => {
    const res = await clienteAgent
      .post("/itens")
      .send({ nome: "Item Teste Proibido", descricao: "x", categoria: "BEBIDA" });
    expect(res.status).toBe(403);
  });

  it("hides inactive items from clientes but not from admins", async () => {
    await adminAgent.put(`/itens/${createdId}`).send({ ativo: false });

    const adminList = await adminAgent.get("/itens");
    expect(adminList.body.some((i: { id: number }) => i.id === createdId)).toBe(true);

    const clienteList = await clienteAgent.get("/itens");
    expect(clienteList.body.some((i: { id: number }) => i.id === createdId)).toBe(false);
  });
});
