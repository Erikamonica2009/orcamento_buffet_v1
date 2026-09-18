import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createRateLimiter } from "../middlewares/rateLimit";
import {
  createOrcamentoSchema,
  orcamentoStatusEnum,
  respostaClienteSchema,
  updateOrcamentoStatusSchema,
} from "../schemas/orcamentos.schemas";
import * as orcamentosService from "../services/orcamentos.service";
import { parseId } from "../utils/parseId";

export const orcamentosRouter = Router();

const criarOrcamentoLimiter = createRateLimiter(60_000, 20);

orcamentosRouter.use(requireAuth);

orcamentosRouter.post(
  "/",
  requireRole("cliente"),
  criarOrcamentoLimiter,
  asyncHandler(async (req, res) => {
    const input = createOrcamentoSchema.parse(req.body);
    const orcamento = await orcamentosService.createOrcamento(req.auth!.sub, input);
    res.status(201).json(orcamento);
  })
);

orcamentosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    if (req.auth!.role === "cliente") {
      res.json(await orcamentosService.listOrcamentosForCliente(req.auth!.sub));
      return;
    }
    const status = req.query.status ? orcamentoStatusEnum.parse(req.query.status) : undefined;
    res.json(await orcamentosService.listOrcamentosForAdmin(status));
  })
);

orcamentosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (req.auth!.role === "cliente") {
      res.json(await orcamentosService.getOrcamentoForCliente(id, req.auth!.sub));
      return;
    }
    res.json(await orcamentosService.getOrcamentoForAdmin(id));
  })
);

orcamentosRouter.patch(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = updateOrcamentoStatusSchema.parse(req.body);
    const orcamento = await orcamentosService.updateOrcamentoStatus(
      parseId(req.params.id),
      req.auth!.sub,
      input
    );
    res.json(orcamento);
  })
);

orcamentosRouter.patch(
  "/:id/aceite",
  requireRole("cliente"),
  asyncHandler(async (req, res) => {
    const input = respostaClienteSchema.parse(req.body);
    const orcamento = await orcamentosService.responderAceiteCliente(
      parseId(req.params.id),
      req.auth!.sub,
      input.aceitar
    );
    res.json(orcamento);
  })
);
