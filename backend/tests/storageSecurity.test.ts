import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { blindIndex, decrypt, encrypt, isEncrypted } from "../src/utils/crypto";
import { maskCpf, maskTelefone } from "../src/utils/dataMasking";
import { BCRYPT_COST, hashPassword, needsRehash } from "../src/utils/password";

const ADMIN_EMAIL = "storage-test-admin@buffet.com";
const SENHA = "senha-correta-123";
const CPF = "13000000070";
const TELEFONE = "11977776543";

let adminAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const senhaHash = await hashPassword(SENHA);
  await prisma.admin.create({ data: { nome: "Admin Storage", email: ADMIN_EMAIL, senhaHash } });
  adminAgent = request.agent(app);
  await adminAgent.post("/auth/admin/login").send({ email: ADMIN_EMAIL, senha: SENHA });
});

afterAll(async () => {
  await prisma.admin.deleteMany({ where: { email: { contains: "storage-test" } } });
  await prisma.cliente.deleteMany({ where: { email: { contains: "storage-test" } } });
  await prisma.$disconnect();
});

describe("Criptografia em repouso (unidade)", () => {
  it("cifra e decifra de volta o valor original", () => {
    const cifrado = encrypt(CPF);
    expect(isEncrypted(cifrado)).toBe(true);
    expect(cifrado).not.toContain(CPF);
    expect(decrypt(cifrado)).toBe(CPF);
  });

  it("gera textos cifrados diferentes para o mesmo valor (IV aleatório)", () => {
    expect(encrypt(CPF)).not.toBe(encrypt(CPF));
  });

  it("rejeita um texto cifrado adulterado (integridade do GCM)", () => {
    const [prefixo, versao, iv, tag, dados] = encrypt(CPF).split(":");
    const bytes = Buffer.from(dados, "base64");
    bytes[0] ^= 0xff;
    const adulterado = [prefixo, versao, iv, tag, bytes.toString("base64")].join(":");
    expect(() => decrypt(adulterado)).toThrow();
  });

  it("blind index é determinístico e não revela o CPF", () => {
    expect(blindIndex(CPF)).toBe(blindIndex(CPF));
    expect(blindIndex(CPF)).not.toContain(CPF);
  });
});

describe("Mascaramento de dados (unidade)", () => {
  it("mostra só os 4 últimos dígitos do CPF e do telefone", () => {
    expect(maskCpf("12345678909")).toBe("***.***.*89-09");
    expect(maskTelefone("11977776543")).toBe("(**) *****-6543");
    expect(maskTelefone("1133334444")).toBe("(**) ****-4444");
  });
});

describe("Hashing de senhas (unidade)", () => {
  it("usa bcrypt com salt e custo configurado", async () => {
    const a = await hashPassword("mesma-senha");
    const b = await hashPassword("mesma-senha");
    expect(a).not.toBe(b);
    expect(bcrypt.getRounds(a)).toBe(BCRYPT_COST);
    expect(await bcrypt.compare("mesma-senha", a)).toBe(true);
  });
});

describe("Cadastro de cliente (integração)", () => {
  it("grava CPF/telefone cifrados e senha com hash; a API devolve os dados mascarados", async () => {
    const res = await request(app).post("/clientes").send({
      nome: "Cliente Storage",
      email: "storage-test-cliente@buffet.com",
      senha: "Senha@123",
      telefone: TELEFONE,
      cpf: CPF,
    });

    expect(res.status).toBe(201);
    expect(res.body.cpf).toBe(maskCpf(CPF));
    expect(res.body.telefone).toBe(maskTelefone(TELEFONE));

    const linha = await prisma.cliente.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(linha.cpf).not.toContain(CPF);
    expect(linha.telefone).not.toContain(TELEFONE);
    expect(decrypt(linha.cpf)).toBe(CPF);
    expect(linha.cpfHash).toBe(blindIndex(CPF));
    expect(linha.senhaHash).not.toContain("Senha@123");
    expect(bcrypt.getRounds(linha.senhaHash)).toBe(BCRYPT_COST);
  });

  it("continua bloqueando CPF duplicado mesmo com o CPF cifrado", async () => {
    const res = await request(app).post("/clientes").send({
      nome: "Cliente Storage Duplicado",
      email: "storage-test-duplicado@buffet.com",
      senha: "Senha@123",
      telefone: TELEFONE,
      cpf: CPF,
    });
    expect(res.status).toBe(409);
  });

  it("a listagem do admin não expõe CPF nem telefone completos", async () => {
    const res = await adminAgent.get("/clientes");
    const cliente = res.body.find((c: { email: string }) => c.email === "storage-test-cliente@buffet.com");
    expect(cliente.cpf).toBe(maskCpf(CPF));
    expect(JSON.stringify(res.body)).not.toContain(CPF);
  });
});

describe("Rehash transparente no login", () => {
  it("atualiza um hash antigo (custo 10) para o custo atual após login bem-sucedido", async () => {
    const email = "storage-test-legado@buffet.com";
    await prisma.admin.create({
      data: { nome: "Admin Legado", email, senhaHash: await bcrypt.hash(SENHA, 10) },
    });

    const res = await request(app).post("/auth/admin/login").send({ email, senha: SENHA });
    expect(res.status).toBe(200);

    const admin = await prisma.admin.findUniqueOrThrow({ where: { email } });
    expect(needsRehash(admin.senhaHash)).toBe(false);
  });
});
