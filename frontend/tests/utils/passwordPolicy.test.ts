import { describe, it, expect } from "vitest";
import { senhaSchema } from "../../src/utils/passwordPolicy";

describe("senhaSchema (frontend)", () => {
  it.each(["Ab1@cd", "Senha@123", "Abcdefghijk1234!"])("aceita %s", (senha) => {
    expect(senhaSchema.safeParse(senha).success).toBe(true);
  });

  it.each([
    ["curta demais", "Ab1@c"],
    ["longa demais", "Abcdefghijk1234!x"],
    ["sem maiúscula", "senha@123"],
    ["sem minúscula", "SENHA@123"],
    ["sem número", "Senha@abc"],
    ["sem caractere especial", "Senha1234"],
  ])("rejeita senha %s", (_caso, senha) => {
    expect(senhaSchema.safeParse(senha).success).toBe(false);
  });
});
