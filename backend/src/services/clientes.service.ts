import bcrypt from "bcryptjs";
import { AppError } from "../middlewares/AppError";
import * as clientesRepo from "../repositories/clientes.repository";
import { CreateClienteInput } from "../schemas/clientes.schemas";

function toPublic(cliente: {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  createdAt: Date;
}) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    telefone: cliente.telefone,
    cpf: cliente.cpf,
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

  const senhaHash = await bcrypt.hash(input.senha, 10);
  const cliente = await clientesRepo.createClienteRecord({
    nome: input.nome,
    email: input.email,
    senhaHash,
    telefone: input.telefone,
    cpf: input.cpf,
  });

  return toPublic(cliente);
}
