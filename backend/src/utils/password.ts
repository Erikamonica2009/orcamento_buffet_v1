import bcrypt from "bcryptjs";

// Hashing de senhas: bcrypt gera um salt aleatório por senha e o embute no próprio hash.
// Custo 12 = 2^12 rodadas; torna caro o ataque de força bruta offline após um vazamento.
export const BCRYPT_COST = 12;

export function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, BCRYPT_COST);
}

export function verifyPassword(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

// Hashes antigos (custo menor) são refeitos de forma transparente no próximo login bem-sucedido.
export function needsRehash(hash: string): boolean {
  return bcrypt.getRounds(hash) < BCRYPT_COST;
}

// Hash usado quando o e-mail não existe, para que o tempo de resposta do login seja o mesmo
// e não revele quais e-mails estão cadastrados.
export const DUMMY_HASH = bcrypt.hashSync("senha-inexistente", BCRYPT_COST);
