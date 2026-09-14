import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createTipoEventoSchema, updateTipoEventoSchema } from "../schemas/tiposEvento.schemas";
import * as tiposEventoService from "../services/tiposEvento.service";
import { parseId } from "../utils/parseId";

export const tiposEventoRouter = Router();

tiposEventoRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const onlyActive = req.auth!.role === "cliente";
    res.json(await tiposEventoService.listTiposEvento(onlyActive));
  })
);

tiposEventoRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await tiposEventoService.getTipoEvento(parseId(req.params.id)));
  })
);

tiposEventoRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = createTipoEventoSchema.parse(req.body);
    res.status(201).json(await tiposEventoService.createTipoEvento(input));
  })
);

tiposEventoRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = updateTipoEventoSchema.parse(req.body);
    res.json(await tiposEventoService.updateTipoEvento(parseId(req.params.id), input));
  })
);

tiposEventoRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    res.json(await tiposEventoService.deactivateTipoEvento(parseId(req.params.id)));
  })
);
