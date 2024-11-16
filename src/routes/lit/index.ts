import express from "express";
import { createNewPKP } from "./lit.js";

const litRouter = express.Router();

litRouter.post("/create", createNewPKP);

export { litRouter };
