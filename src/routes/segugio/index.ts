import express from "express";
import { createSegugio, fireTx, promptTx, withdraw } from "./segugio.js";

const segugioRouter = express.Router();

segugioRouter.post("/create", createSegugio);
segugioRouter.post("/tx", fireTx);
segugioRouter.post("/prompt-tx", promptTx);
segugioRouter.post("/withdraw", withdraw);

export { segugioRouter };
