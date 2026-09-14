import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createItemSchema, updateItemSchema } from "../schemas/itens.schemas";
import * as itensService from "../services/itens.service";

export const itensRouter = Router();

itensRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const onlyActive = req.auth!.role === "cliente";
    res.json(await itensService.listItens(onlyActive));
  })
);

itensRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await itensService.getItem(Number(req.params.id)));
  })
);

itensRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = createItemSchema.parse(req.body);
    res.status(201).json(await itensService.createItem(input));
  })
);

itensRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = updateItemSchema.parse(req.body);
    res.json(await itensService.updateItem(Number(req.params.id), input));
  })
);

itensRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    res.json(await itensService.deactivateItem(Number(req.params.id)));
  })
);
