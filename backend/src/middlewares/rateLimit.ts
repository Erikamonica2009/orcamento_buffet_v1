import rateLimit from "express-rate-limit";

export function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: "Muitas requisições. Tente novamente mais tarde." });
    },
  });
}
