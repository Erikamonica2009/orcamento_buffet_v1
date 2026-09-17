export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};

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
