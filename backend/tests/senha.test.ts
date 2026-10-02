import { describe, it, expect } from "vitest";
import { senhaSchema } from "../src/schemas/senha.schemas";

describe("senhaSchema", () => {
  it.each(["Ab1@cd", "Senha@123", "Abcdefghijk1234!", "Çé9#xY"])("aceita %s", (senha) => {
    expect(senhaSchema.safeParse(senha).success).toBe(true);
  });

  it.each([
    ["curta demais (5)", "Ab1@c", "no mínimo 6"],
    ["longa demais (17)", "Abcdefghijk1234!x", "no máximo 16"],
    ["sem maiúscula", "senha@123", "maiúscula"],
    ["sem minúscula", "SENHA@123", "minúscula"],
    ["sem número", "Senha@abc", "número"],
    ["sem caractere especial", "Senha1234", "caractere especial"],
    ["espaço não conta como especial", "Senha 123", "caractere especial"],
  ])("rejeita senha %s", (_caso, senha, mensagem) => {
    const result = senhaSchema.safeParse(senha);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message).join(" | ")).toContain(mensagem);
    }
  });
});
