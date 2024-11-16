import express from "express";
import { createTransaction } from "./1inch.js";

const oneInchRouter = express.Router();

oneInchRouter.post("/tx", createTransaction);

export { oneInchRouter };
