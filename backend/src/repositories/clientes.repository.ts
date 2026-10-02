import { Cliente } from "@prisma/client";
import { prisma } from "../config/prisma";
import { blindIndex, decrypt, encrypt } from "../utils/crypto";

// Esta camada é a única que enxerga o formato cifrado: grava CPF/telefone com AES-256-GCM e
// devolve sempre os registros já decifrados para os services.
function decryptCliente(cliente: Cliente): Cliente {
  return { ...cliente, cpf: decrypt(cliente.cpf), telefone: decrypt(cliente.telefone) };
}

function decryptOrNull(cliente: Cliente | null) {
  return cliente ? decryptCliente(cliente) : null;
}

export async function findAllClientes() {
  const clientes = await prisma.cliente.findMany({ orderBy: { id: "asc" } });
  return clientes.map(decryptCliente);
}

export async function findClienteById(id: number) {
  return decryptOrNull(await prisma.cliente.findUnique({ where: { id } }));
}

export async function findClienteByEmail(email: string) {
  return decryptOrNull(await prisma.cliente.findUnique({ where: { email } }));
}

export async function findClienteByCpf(cpf: string) {
  return decryptOrNull(await prisma.cliente.findUnique({ where: { cpfHash: blindIndex(cpf) } }));
}

export async function createClienteRecord(data: {
  nome: string;
  email: string;
  senhaHash: string;
  telefone: string;
  cpf: string;
}) {
  const cliente = await prisma.cliente.create({
    data: {
      ...data,
      telefone: encrypt(data.telefone),
      cpf: encrypt(data.cpf),
      cpfHash: blindIndex(data.cpf),
    },
  });
  return decryptCliente(cliente);
}

export async function updateClienteRecord(
  id: number,
  data: Partial<{ nome: string; email: string; senhaHash: string; telefone: string; cpf: string; ativo: boolean }>
) {
  const { telefone, cpf, ...rest } = data;
  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      ...rest,
      ...(telefone !== undefined && { telefone: encrypt(telefone) }),
      ...(cpf !== undefined && { cpf: encrypt(cpf), cpfHash: blindIndex(cpf) }),
    },
  });
  return decryptCliente(cliente);
}
