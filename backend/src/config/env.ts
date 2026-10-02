export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY || "",
  dataHashKey: process.env.DATA_HASH_KEY || "",
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
};

// Atrás de proxies (Vercel → Render), o IP real do cliente vem no X-Forwarded-For. Sem isso o
// rate limit veria todos os usuários com o IP do proxy e bloquearia todo mundo junto.
// "true" = confiar na cadeia toda; um número = quantos proxies confiar; vazio/false = nenhum.
function parseTrustProxy(value?: string): boolean | number {
  if (value === "true") return true;
  const hops = Number(value);
  return Number.isInteger(hops) && hops > 0 ? hops : false;
}

const HEX_256_BITS = /^[0-9a-fA-F]{64}$/;

if (!HEX_256_BITS.test(env.dataEncryptionKey) || !HEX_256_BITS.test(env.dataHashKey)) {
  throw new Error("DATA_ENCRYPTION_KEY and DATA_HASH_KEY must be 256-bit keys (64 hex characters)");
}
if (env.dataEncryptionKey.toLowerCase() === env.dataHashKey.toLowerCase()) {
  throw new Error("DATA_ENCRYPTION_KEY and DATA_HASH_KEY must be different keys");
}

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

const WEAK_DEFAULT_JWT_SECRET = "dev-only-change-me";

if (env.nodeEnv === "production" && env.jwtSecret === WEAK_DEFAULT_JWT_SECRET) {
  throw new Error("JWT_SECRET must be changed from the example value in production");
}
if (env.jwtSecret === WEAK_DEFAULT_JWT_SECRET) {
  console.warn("[WARN] Using the example JWT_SECRET value — safe only for local development.");
}
