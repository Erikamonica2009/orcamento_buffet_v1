-- CPF passa a ser gravado cifrado (texto diferente a cada gravação), então a unicidade
-- migra para o blind index "cpf_hash" (HMAC-SHA256 do CPF).
-- Os registros antigos em texto puro são cifrados pelo script dist/scripts/setupDatabase.js.
DROP INDEX "clientes_cpf_key";

ALTER TABLE "clientes" ADD COLUMN "cpf_hash" TEXT;

CREATE UNIQUE INDEX "clientes_cpf_hash_key" ON "clientes"("cpf_hash");
