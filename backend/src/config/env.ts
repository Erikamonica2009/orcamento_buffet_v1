export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "",
};

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}
