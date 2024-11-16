import express from "express";
import { createSegugio, fireTx } from "./segugio.js";

const segugioRouter = express.Router();

segugioRouter.post("/create", createSegugio);
segugioRouter.post("/tx", fireTx);

export { segugioRouter };
