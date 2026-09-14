import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "admins-test-admin@buffet.com";
const SENHA = "senha-correta-123";

let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const senhaHash = await bcrypt.hash(SENHA, 10);
  await prisma.admin.create({ data: { nome: "Admin Teste", email: ADMIN_EMAIL, senhaHash } });

  agent = request.agent(app);
  await agent.post("/auth/admin/login").send({ email: ADMIN_EMAIL, senha: SENHA });
});

afterAll(async () => {
  await prisma.admin.deleteMany({ where: { email: { contains: "admins-test" } } });
  await prisma.$disconnect();
});

describe("Admins CRUD", () => {
  it("rejects unauthenticated access", async () => {
    const res = await request(app).get("/admins");
    expect(res.status).toBe(401);
  });

  it("creates, lists, updates, and deletes an admin without ever leaking senhaHash", async () => {
    const createRes = await agent
      .post("/admins")
      .send({ nome: "Novo Admin", email: "admins-test-novo@buffet.com", senha: "outrasenha123" });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({ nome: "Novo Admin", email: "admins-test-novo@buffet.com" });
    expect(createRes.body.senhaHash).toBeUndefined();
    const newId = createRes.body.id;

    const listRes = await agent.get("/admins");
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((a: { id: number }) => a.id === newId)).toBe(true);

    const updateRes = await agent.put(`/admins/${newId}`).send({ nome: "Admin Renomeado" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.nome).toBe("Admin Renomeado");

    const deleteRes = await agent.delete(`/admins/${newId}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await agent.get(`/admins/${newId}`);
    expect(getRes.status).toBe(404);
  });

  it("rejects duplicate email with 409", async () => {
    const res = await agent
      .post("/admins")
      .send({ nome: "Duplicado", email: ADMIN_EMAIL, senha: "senha123456" });
    expect(res.status).toBe(409);
  });

  it("rejects updating an admin's email to one already in use with 409", async () => {
    const createRes = await agent
      .post("/admins")
      .send({ nome: "Outro Admin", email: "admins-test-outro@buffet.com", senha: "outrasenha123" });
    const otherId = createRes.body.id;

    const res = await agent.put(`/admins/${otherId}`).send({ email: ADMIN_EMAIL });
    expect(res.status).toBe(409);

    await agent.delete(`/admins/${otherId}`);
  });

  it("rejects a non-numeric id param with 400 instead of crashing", async () => {
    const res = await agent.get("/admins/not-a-number");
    expect(res.status).toBe(400);
  });
});
