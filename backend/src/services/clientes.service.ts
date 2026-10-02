import { AppError } from "../middlewares/AppError";
import * as clientesRepo from "../repositories/clientes.repository";
import { CreateClienteInput, UpdateClienteInput } from "../schemas/clientes.schemas";
import { maskCpf, maskTelefone } from "../utils/dataMasking";
import { hashPassword } from "../utils/password";

// CPF e telefone saem da API sempre mascarados: nenhuma tela precisa do valor completo
// depois do cadastro (o admin vê só os 4 últimos dígitos).
function toPublic(cliente: {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  ativo: boolean;
  createdAt: Date;
}) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    telefone: maskTelefone(cliente.telefone),
    cpf: maskCpf(cliente.cpf),
    ativo: cliente.ativo,
    createdAt: cliente.createdAt,
  };
}

export async function listClientes() {
  const clientes = await clientesRepo.findAllClientes();
  return clientes.map(toPublic);
}

export async function getCliente(id: number) {
  const cliente = await clientesRepo.findClienteById(id);
  if (!cliente) {
    throw new AppError(404, "Cliente não encontrado");
  }
  return toPublic(cliente);
}

export async function registerCliente(input: CreateClienteInput) {
  const [existingEmail, existingCpf] = await Promise.all([
    clientesRepo.findClienteByEmail(input.email),
    clientesRepo.findClienteByCpf(input.cpf),
  ]);

  if (existingEmail) {
    throw new AppError(409, "Já existe um cadastro com este e-mail");
  }
  if (existingCpf) {
    throw new AppError(409, "Já existe um cadastro com este CPF");
  }

  const senhaHash = await hashPassword(input.senha);
  const cliente = await clientesRepo.createClienteRecord({
    nome: input.nome,
    email: input.email,
    senhaHash,
    telefone: input.telefone,
    cpf: input.cpf,
  });

  return toPublic(cliente);
}

export async function updateCliente(id: number, input: UpdateClienteInput) {
  await getCliente(id);

  if (input.email !== undefined) {
    const existing = await clientesRepo.findClienteByEmail(input.email);
    if (existing && existing.id !== id) {
      throw new AppError(409, "Já existe um cadastro com este e-mail");
    }
  }
  if (input.cpf !== undefined) {
    const existing = await clientesRepo.findClienteByCpf(input.cpf);
    if (existing && existing.id !== id) {
      throw new AppError(409, "Já existe um cadastro com este CPF");
    }
  }

  const data: Partial<{
    nome: string;
    email: string;
    senhaHash: string;
    telefone: string;
    cpf: string;
    ativo: boolean;
  }> = {};
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.email !== undefined) data.email = input.email;
  if (input.telefone !== undefined) data.telefone = input.telefone;
  if (input.cpf !== undefined) data.cpf = input.cpf;
  if (input.ativo !== undefined) data.ativo = input.ativo;
  if (input.senha !== undefined) data.senhaHash = await hashPassword(input.senha);

  const cliente = await clientesRepo.updateClienteRecord(id, data);
  return toPublic(cliente);
}

export async function deactivateCliente(id: number) {
  await getCliente(id);
  return toPublic(await clientesRepo.updateClienteRecord(id, { ativo: false }));
}
