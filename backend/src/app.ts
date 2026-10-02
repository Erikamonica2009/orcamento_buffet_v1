import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFound";
import { authRouter } from "./controllers/auth.controller";
import { adminsRouter } from "./controllers/admins.controller";
import { clientesRouter } from "./controllers/clientes.controller";
import { tiposEventoRouter } from "./controllers/tiposEvento.controller";
import { itensRouter } from "./controllers/itens.controller";
import { orcamentosRouter } from "./controllers/orcamentos.controller";

export const app = express();

app.set("trust proxy", env.trustProxy);
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/admins", adminsRouter);
app.use("/clientes", clientesRouter);
app.use("/tipos-evento", tiposEventoRouter);
app.use("/itens", itensRouter);
app.use("/orcamentos", orcamentosRouter);

app.use(notFoundHandler);
app.use(errorHandler);
