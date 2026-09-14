import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFound";
import { authRouter } from "./controllers/auth.controller";
import { adminsRouter } from "./controllers/admins.controller";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/admins", adminsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
