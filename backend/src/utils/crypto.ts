import crypto from "crypto";
import { env } from "../config/env";

// Criptografia em repouso (data at rest) no nível da aplicação.
// Campos sensíveis (CPF, telefone) são gravados no banco como AES-256-GCM: quem copiar os
// arquivos do Postgres (ou um dump/backup) leva apenas texto cifrado, ilegível sem a chave
// DATA_ENCRYPTION_KEY, que fica fora do banco (variável de ambiente do backend).
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const PREFIX = "enc:v1:";

const encryptionKey = Buffer.from(env.dataEncryptionKey, "hex");
const hashKey = Buffer.from(env.dataHashKey, "hex");

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encrypt(plain: string): string {
  // IV aleatório por gravação: o mesmo CPF cifrado duas vezes gera textos diferentes.
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decrypt(stored: string): string {
  if (!isEncrypted(stored)) {
    throw new Error("Valor não está cifrado");
  }
  const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, Buffer.from(ivB64, "base64"));
  // O auth tag do GCM garante integridade: um valor adulterado no banco falha aqui.
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

// "Blind index": HMAC-SHA256 determinístico do valor. Permite buscar e garantir unicidade do CPF
// sem guardá-lo em texto puro (o texto cifrado muda a cada gravação, então não serve de chave).
export function blindIndex(value: string): string {
  return crypto.createHmac("sha256", hashKey).update(value).digest("hex");
}
