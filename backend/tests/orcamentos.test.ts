import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { createClienteRecord } from "../src/repositories/clientes.repository";

const ADMIN_EMAIL = "orcamentos-test-admin@buffet.com";
const CLIENTE_EMAIL = "orcamentos-test-cliente@buffet.com";
const OUTRO_CLIENTE_EMAIL = "orcamentos-test-outro@buffet.com";
const SENHA = "senha-correta-123";

const DIA_MS = 24 * 60 * 60 * 1000;
// Data relativa a hoje para o teste não "vencer" com o passar do tempo.
const DATA_FUTURA = new Date(Date.now() + 60 * DIA_MS).toISOString();

let adminAgent: ReturnType<typeof request.agent>;
let clienteAgent: ReturnType<typeof request.agent>;
let outroClienteAgent: ReturnType<typeof request.agent>;
let tipoEventoId: number;
let itemId: number;
let clienteId: number;

beforeAll(async () => {
  const senhaHash = await bcrypt.hash(SENHA, 10);

  await prisma.admin.create({ data: { nome: "Admin Teste", email: ADMIN_EMAIL, senhaHash } });
  const cliente = await createClienteRecord({
    nome: "Cliente Teste",
    email: CLIENTE_EMAIL,
    senhaHash,
    telefone: "11999990000",
    cpf: "87777777866",
  });
  clienteId = cliente.id;
  await createClienteRecord({
    nome: "Outro Cliente",
    email: OUTRO_CLIENTE_EMAIL,
    senhaHash,
    telefone: "11999990001",
    cpf: "98888888977",
  });

  const tipoEvento = await prisma.tipoEvento.create({
    data: { nome: "Tipo Teste Orçamento", descricao: "x" },
  });
  tipoEventoId = tipoEvento.id;

  const item = await prisma.item.create({
    data: { nome: "Item Teste Orçamento", descricao: "x", categoria: "COMIDA" },
  });
  itemId = item.id;

  adminAgent = request.agent(app);
  await adminAgent.post("/auth/admin/login").send({ email: ADMIN_EMAIL, senha: SENHA });

  clienteAgent = request.agent(app);
  await clienteAgent.post("/auth/cliente/login").send({ email: CLIENTE_EMAIL, senha: SENHA });

  outroClienteAgent = request.agent(app);
  await outroClienteAgent.post("/auth/cliente/login").send({ email: OUTRO_CLIENTE_EMAIL, senha: SENHA });
});

afterAll(async () => {
  await prisma.orcamentoItem.deleteMany({ where: { itemId } });
  await prisma.orcamento.deleteMany({ where: { tipoEventoId } });
  await prisma.item.deleteMany({ where: { id: itemId } });
  await prisma.tipoEvento.deleteMany({ where: { id: tipoEventoId } });
  await prisma.admin.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.cliente.deleteMany({ where: { email: { in: [CLIENTE_EMAIL, OUTRO_CLIENTE_EMAIL] } } });
  await prisma.$disconnect();
});

describe("POST /orcamentos", () => {
  it("lets an authenticated cliente request an orçamento, ignoring any clienteId in the body", async () => {
    const res = await clienteAgent.post("/orcamentos").send({
      clienteId: 999999,
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 100,
      observacoes: "Festa de fim de ano",
      itensIds: [itemId],
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDENTE");
    expect(res.body.valorTotal).toBeNull();
    expect(res.body.itens).toHaveLength(1);
    expect(res.body.cliente?.senhaHash).toBeUndefined();
    expect(res.body.clienteId).not.toBe(999999);
    expect(res.body.clienteId).toBe(clienteId);
  });

  it("rejects an admin trying to create an orçamento", async () => {
    const res = await adminAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 10,
      itensIds: [itemId],
    });
    expect(res.status).toBe(403);
  });

  it("rejects a request with no itens selected", async () => {
    const res = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 10,
      itensIds: [],
    });
    expect(res.status).toBe(400);
  });

  it.each([
    ["no passado", new Date(Date.now() - 3 * DIA_MS).toISOString()],
    ["além de 2 anos", new Date(Date.now() + 3 * 365 * DIA_MS).toISOString()],
    ["com ano de 6 dígitos", "202612-12-24"],
  ])("rejects a dataEvento %s with 400", async (_caso, dataEvento) => {
    const res = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento,
      numConvidados: 10,
      itensIds: [itemId],
    });
    expect(res.status).toBe(400);
  });

  it("rejects a request with duplicate itensIds", async () => {
    const res = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 10,
      itensIds: [itemId, itemId],
    });
    expect(res.status).toBe(400);
  });

  it("rejects an inactive tipoEvento", async () => {
    const inactiveTipo = await prisma.tipoEvento.create({
      data: { nome: "Tipo Teste Inativo", descricao: "x", ativo: false },
    });

    const res = await clienteAgent.post("/orcamentos").send({
      tipoEventoId: inactiveTipo.id,
      dataEvento: DATA_FUTURA,
      numConvidados: 10,
      itensIds: [itemId],
    });
    expect(res.status).toBe(400);

    await prisma.tipoEvento.delete({ where: { id: inactiveTipo.id } });
  });

  it("rejects an inactive item", async () => {
    const inactiveItem = await prisma.item.create({
      data: { nome: "Item Teste Inativo", descricao: "x", categoria: "COMIDA", ativo: false },
    });

    const res = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 10,
      itensIds: [inactiveItem.id],
    });
    expect(res.status).toBe(400);

    await prisma.item.delete({ where: { id: inactiveItem.id } });
  });
});

describe("GET /orcamentos and /orcamentos/:id — scoping", () => {
  let orcamentoId: number;

  it("cliente only sees their own orçamentos", async () => {
    const createRes = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 50,
      itensIds: [itemId],
    });
    orcamentoId = createRes.body.id;

    const ownList = await clienteAgent.get("/orcamentos");
    expect(ownList.body.some((o: { id: number }) => o.id === orcamentoId)).toBe(true);

    const otherList = await outroClienteAgent.get("/orcamentos");
    expect(otherList.body.some((o: { id: number }) => o.id === orcamentoId)).toBe(false);
  });

  it("rejects a cliente reading another cliente's orçamento by id", async () => {
    const res = await outroClienteAgent.get(`/orcamentos/${orcamentoId}`);
    expect(res.status).toBe(403);
  });

  it("admin sees any orçamento regardless of owner", async () => {
    const res = await adminAgent.get(`/orcamentos/${orcamentoId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orcamentoId);
  });
});

describe("PATCH /orcamentos/:id — admin decision", () => {
  it("requires valorTotal to approve", async () => {
    const createRes = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 30,
      itensIds: [itemId],
    });
    const id = createRes.body.id;

    const missingValor = await adminAgent.patch(`/orcamentos/${id}`).send({ status: "APROVADO" });
    expect(missingValor.status).toBe(400);

    const approved = await adminAgent
      .patch(`/orcamentos/${id}`)
      .send({ status: "APROVADO", valorTotal: 4500 });
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe("APROVADO");
    // Prisma's Decimal serializes to a string (e.g. "4500" or "4500.00" depending on
    // decimal.js normalization) — compare numerically so the exact formatting doesn't matter.
    expect(Number(approved.body.valorTotal)).toBe(4500);
  });

  it("rejects a cliente trying to change status", async () => {
    const createRes = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 20,
      itensIds: [itemId],
    });
    const id = createRes.body.id;

    const res = await clienteAgent
      .patch(`/orcamentos/${id}`)
      .send({ status: "APROVADO", valorTotal: 100 });
    expect(res.status).toBe(403);
  });

  it("rejects changing the status of an already-decided orçamento", async () => {
    const createRes = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 15,
      itensIds: [itemId],
    });
    const id = createRes.body.id;

    await adminAgent.patch(`/orcamentos/${id}`).send({ status: "RECUSADO" });

    const res = await adminAgent.patch(`/orcamentos/${id}`).send({ status: "APROVADO", valorTotal: 100 });
    expect(res.status).toBe(409);
  });
});

describe("PATCH /orcamentos/:id/aceite — cliente accepts or rejects the proposed value", () => {
  async function criarOrcamentoAguardandoAceite() {
    const createRes = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 40,
      itensIds: [itemId],
    });
    const id = createRes.body.id;
    await adminAgent
      .patch(`/orcamentos/${id}`)
      .send({ status: "AGUARDANDO_ACEITE_CLIENTE", valorTotal: 3000 });
    return id;
  }

  it("rejects an admin hitting the cliente-only endpoint", async () => {
    const id = await criarOrcamentoAguardandoAceite();
    const res = await adminAgent.patch(`/orcamentos/${id}/aceite`).send({ aceitar: true });
    expect(res.status).toBe(403);
  });

  it("rejects another cliente responding to someone else's orçamento", async () => {
    const id = await criarOrcamentoAguardandoAceite();
    const res = await outroClienteAgent.patch(`/orcamentos/${id}/aceite`).send({ aceitar: true });
    expect(res.status).toBe(403);
  });

  it("rejects responding when the orçamento is not awaiting cliente acceptance", async () => {
    const createRes = await clienteAgent.post("/orcamentos").send({
      tipoEventoId,
      dataEvento: DATA_FUTURA,
      numConvidados: 12,
      itensIds: [itemId],
    });
    const id = createRes.body.id;

    const res = await clienteAgent.patch(`/orcamentos/${id}/aceite`).send({ aceitar: true });
    expect(res.status).toBe(409);
  });

  it("moves the orçamento to AGUARDANDO_PAGAMENTO when the cliente accepts", async () => {
    const id = await criarOrcamentoAguardandoAceite();

    const res = await clienteAgent.patch(`/orcamentos/${id}/aceite`).send({ aceitar: true });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(Number(res.body.valorTotal)).toBe(3000);
  });

  it("moves the orçamento to RECUSADO when the cliente rejects", async () => {
    const id = await criarOrcamentoAguardandoAceite();

    const res = await clienteAgent.patch(`/orcamentos/${id}/aceite`).send({ aceitar: false });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RECUSADO");
  });
});
