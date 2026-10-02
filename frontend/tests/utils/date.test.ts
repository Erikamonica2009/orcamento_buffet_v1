import { describe, it, expect } from "vitest";
import { dataEventoMax, dataEventoMin, formatDataEvento, validarDataEvento } from "../../src/utils/date";

describe("formatDataEvento", () => {
  it("formats a date-only UTC-midnight ISO string as the same calendar day, regardless of local timezone", () => {
    expect(formatDataEvento("2026-09-20T00:00:00.000Z")).toBe("20/09/2026");
  });
});

describe("limites da data do evento", () => {
  const hoje = new Date(2026, 9, 1); // 01/10/2026

  it("vai de hoje até 2 anos à frente, sempre com ano de 4 dígitos", () => {
    expect(dataEventoMin(hoje)).toBe("2026-10-01");
    expect(dataEventoMax(hoje)).toBe("2028-10-01");
  });

  it("aceita datas dentro da janela, inclusive os extremos", () => {
    expect(validarDataEvento("2026-10-01", hoje)).toBeNull();
    expect(validarDataEvento("2027-05-15", hoje)).toBeNull();
    expect(validarDataEvento("2028-10-01", hoje)).toBeNull();
  });

  it("rejeita ano com mais de 4 dígitos", () => {
    expect(validarDataEvento("202612-12-24", hoje)).toBe("Data inválida");
    expect(validarDataEvento("275760-01-01", hoje)).toBe("Data inválida");
  });

  it("rejeita datas no passado e além do limite", () => {
    expect(validarDataEvento("2026-09-30", hoje)).toMatch(/passado/);
    expect(validarDataEvento("2028-10-02", hoje)).toMatch(/até 2 anos/);
  });

  it("exige a data", () => {
    expect(validarDataEvento("", hoje)).toBe("Informe a data do evento");
  });
});
