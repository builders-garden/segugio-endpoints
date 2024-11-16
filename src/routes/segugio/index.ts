import express from "express";
import { createSegugio, fireTx, swapTx, withdraw } from "./segugio.js";

const segugioRouter = express.Router();

segugioRouter.post("/create", createSegugio);
segugioRouter.post("/tx", fireTx);
segugioRouter.post("/swap", swapTx);
segugioRouter.post("/withdraw", withdraw);

export { segugioRouter };
