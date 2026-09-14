import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createRateLimiter } from "../middlewares/rateLimit";
import { createClienteSchema } from "../schemas/clientes.schemas";
import * as clientesService from "../services/clientes.service";

export const clientesRouter = Router();

const cadastroLimiter = createRateLimiter(60_000, 20);

clientesRouter.post(
  "/",
  cadastroLimiter,
  asyncHandler(async (req, res) => {
    const input = createClienteSchema.parse(req.body);
    res.status(201).json(await clientesService.registerCliente(input));
  })
);

clientesRouter.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    res.json(await clientesService.listClientes());
  })
);

clientesRouter.get(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    res.json(await clientesService.getCliente(Number(req.params.id)));
  })
);
