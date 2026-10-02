// Mascaramento de dados (data masking): quem não precisa do dado completo vê só o final dele.

export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.***.*${digits.slice(7, 9)}-${digits.slice(9)}`;
}

export function maskTelefone(telefone: string): string {
  const digits = telefone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  const ultimos4 = digits.slice(-4);
  return digits.length === 11 ? `(**) *****-${ultimos4}` : `(**) ****-${ultimos4}`;
}
