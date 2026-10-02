export function formatDataEvento(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// Janela aceita para a data do evento: de hoje até MAX_ANOS_ANTECEDENCIA anos à frente.
// O backend aplica o mesmo limite (backend/src/schemas/orcamentos.schemas.ts).
export const MAX_ANOS_ANTECEDENCIA = 2;

function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dataEventoMin(hoje = new Date()): string {
  return toInputDate(hoje);
}

export function dataEventoMax(hoje = new Date()): string {
  const limite = new Date(hoje);
  limite.setFullYear(limite.getFullYear() + MAX_ANOS_ANTECEDENCIA);
  return toInputDate(limite);
}

// Valida o valor do <input type="date"> (AAAA-MM-DD). Comparação como texto funciona porque
// o formato é de tamanho fixo e ordenado do ano para o dia.
export function validarDataEvento(valor: string, hoje = new Date()): string | null {
  if (!valor) return "Informe a data do evento";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(new Date(valor).getTime())) {
    return "Data inválida";
  }
  if (valor < dataEventoMin(hoje)) return "A data do evento não pode estar no passado";
  if (valor > dataEventoMax(hoje)) {
    return `A data do evento deve ser em até ${MAX_ANOS_ANTECEDENCIA} anos`;
  }
  return null;
}
