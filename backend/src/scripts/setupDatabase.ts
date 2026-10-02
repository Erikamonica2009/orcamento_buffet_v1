import { PrismaClient } from "@prisma/client";
import { blindIndex, encrypt, isEncrypted } from "../utils/crypto";

// Roda na subida do container, ANTES do servidor, conectado com o usuário dono do banco
// (DATABASE_URL_OWNER). Faz duas coisas:
//   1. Princípio do menor privilégio: cria/atualiza o usuário restrito da aplicação
//      (APP_DB_USER), que só pode SELECT/INSERT/UPDATE nas tabelas do sistema (DELETE só em
//      "admins", único lugar com exclusão física). Sem DDL, sem acesso a _prisma_migrations.
//      O servidor HTTP usa esse usuário — nunca o dono/superusuário.
//   2. Criptografia em repouso: cifra CPF/telefone de registros antigos ainda em texto puro.

const APP_TABLES = ["admins", "clientes", "tipos_evento", "itens", "orcamentos", "orcamento_itens"];
const IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
}

// Nomes de role/banco não podem ser parametrizados em DDL; por isso só aceitamos identificadores
// simples validados por whitelist e a senha vai como literal SQL com aspas escapadas.
function quoteLiteral(value: string): string {
  if (value.includes("\0")) throw new Error("Valor inválido");
  return `'${value.replace(/'/g, "''")}'`;
}

async function setupAppRole(prisma: PrismaClient) {
  const appUser = requireEnv("APP_DB_USER");
  const appPassword = requireEnv("APP_DB_PASSWORD");
  if (!IDENTIFIER.test(appUser)) throw new Error("APP_DB_USER deve ser um identificador simples (a-z, 0-9, _)");

  const [{ db }] = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  if (!IDENTIFIER.test(db)) throw new Error("Nome de banco inesperado");

  const exists = await prisma.$queryRaw<unknown[]>`SELECT 1 FROM pg_roles WHERE rolname = ${appUser}`;
  const verb = exists.length ? "ALTER" : "CREATE";
  await prisma.$executeRawUnsafe(
    `${verb} ROLE ${appUser} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD ${quoteLiteral(appPassword)}`
  );

  const statements = [
    `REVOKE CREATE ON SCHEMA public FROM PUBLIC`,
    `GRANT CONNECT ON DATABASE ${db} TO ${appUser}`,
    `GRANT USAGE ON SCHEMA public TO ${appUser}`,
    `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${appUser}`,
    `GRANT SELECT, INSERT, UPDATE ON ${APP_TABLES.join(", ")} TO ${appUser}`,
    `GRANT DELETE ON admins TO ${appUser}`,
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${appUser}`,
  ];
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log(`[setup] Usuário restrito "${appUser}" configurado (SELECT/INSERT/UPDATE; DELETE só em admins).`);
}

async function encryptLegacyClientes(prisma: PrismaClient) {
  const clientes = await prisma.cliente.findMany({ select: { id: true, cpf: true, telefone: true } });
  let migrated = 0;
  for (const cliente of clientes) {
    if (isEncrypted(cliente.cpf) && isEncrypted(cliente.telefone)) continue;
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        cpf: isEncrypted(cliente.cpf) ? cliente.cpf : encrypt(cliente.cpf),
        cpfHash: isEncrypted(cliente.cpf) ? undefined : blindIndex(cliente.cpf),
        telefone: isEncrypted(cliente.telefone) ? cliente.telefone : encrypt(cliente.telefone),
      },
    });
    migrated++;
  }
  console.log(`[setup] Criptografia em repouso: ${migrated} cliente(s) legado(s) cifrado(s).`);
}

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: requireEnv("DATABASE_URL_OWNER") } } });
  try {
    await setupAppRole(prisma);
    await encryptLegacyClientes(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[setup] Falha ao preparar o banco:", err instanceof Error ? err.message : err);
  process.exit(1);
});
