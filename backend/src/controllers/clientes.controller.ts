import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createRateLimiter } from "../middlewares/rateLimit";
import { createClienteSchema, updateClienteSchema } from "../schemas/clientes.schemas";
import * as clientesService from "../services/clientes.service";
import { parseId } from "../utils/parseId";

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
    res.json(await clientesService.getCliente(parseId(req.params.id)));
  })
);

clientesRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = updateClienteSchema.parse(req.body);
    res.json(await clientesService.updateCliente(parseId(req.params.id), input));
  })
);

clientesRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    res.json(await clientesService.deactivateCliente(parseId(req.params.id)));
  })
);
