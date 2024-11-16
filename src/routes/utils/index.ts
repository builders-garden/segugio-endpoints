import express from "express";
import { pingHandler } from "./ping.js";

const utilsRouter = express.Router();

utilsRouter.get("/ping", pingHandler);

export { utilsRouter };
