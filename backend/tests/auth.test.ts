import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "auth-test-admin@buffet.com";
const CLIENTE_EMAIL = "auth-test-cliente@buffet.com";
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
      telefone: "11999990000",
      cpf: "11111111111",
    },
  });
});

afterAll(async () => {
  await prisma.admin.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.cliente.deleteMany({ where: { email: CLIENTE_EMAIL } });
  await prisma.$disconnect();
});

describe("POST /auth/admin/login", () => {
  it("logs in with correct credentials and sets an httpOnly cookie", async () => {
    const res = await request(app)
      .post("/auth/admin/login")
      .send({ email: ADMIN_EMAIL, senha: SENHA });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: expect.any(Number), nome: "Admin Teste", email: ADMIN_EMAIL });

    const cookieHeader = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookieHeader).toContain("HttpOnly");
    expect(cookieHeader).toContain("token=");
  });

  it("rejects wrong password without revealing which field was wrong", async () => {
    const res = await request(app)
      .post("/auth/admin/login")
      .send({ email: ADMIN_EMAIL, senha: "senha-errada" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Credenciais inválidas" });
  });

  it("takes comparable time for a wrong password and a non-existent email (no timing side-channel)", async () => {
    const start1 = Date.now();
    await request(app).post("/auth/admin/login").send({ email: ADMIN_EMAIL, senha: "senha-errada" });
    const wrongPasswordMs = Date.now() - start1;

    const start2 = Date.now();
    await request(app).post("/auth/admin/login").send({ email: "nao-existe@buffet.com", senha: "qualquer" });
    const noSuchUserMs = Date.now() - start2;

    // Both paths now run a real bcrypt compare, so they should be within the same order of
    // magnitude — this is a coarse smoke check, not a precise timing-attack proof.
    expect(Math.abs(wrongPasswordMs - noSuchUserMs)).toBeLessThan(200);
  });

  it("rejects malformed input with 400", async () => {
    const res = await request(app).post("/auth/admin/login").send({ email: "não-é-email" });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/cliente/login", () => {
  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/auth/cliente/login")
      .send({ email: CLIENTE_EMAIL, senha: SENHA });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: expect.any(Number), nome: "Cliente Teste", email: CLIENTE_EMAIL });
  });
});

describe("POST /auth/logout", () => {
  it("clears the auth cookie", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(204);
    const cookieHeader = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookieHeader).toContain("token=;");
  });
});
