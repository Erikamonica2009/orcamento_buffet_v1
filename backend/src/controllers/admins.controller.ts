import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createAdminSchema, updateAdminSchema } from "../schemas/admins.schemas";
import * as adminsService from "../services/admins.service";

export const adminsRouter = Router();

adminsRouter.use(requireAuth, requireRole("admin"));

adminsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await adminsService.listAdmins());
  })
);

adminsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await adminsService.getAdmin(Number(req.params.id)));
  })
);

adminsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createAdminSchema.parse(req.body);
    res.status(201).json(await adminsService.createAdmin(input));
  })
);

adminsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateAdminSchema.parse(req.body);
    res.json(await adminsService.updateAdmin(Number(req.params.id), input));
  })
);

adminsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await adminsService.deleteAdmin(Number(req.params.id));
    res.status(204).send();
  })
);
