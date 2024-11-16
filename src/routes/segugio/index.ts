import express from "express";
import { createSegugio } from "./segugio.js";

const segugioRouter = express.Router();

segugioRouter.post("/create", createSegugio);

export { segugioRouter };
