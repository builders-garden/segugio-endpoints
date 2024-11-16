import type { Request, Response } from "express";
import { Logger } from "../../utils/logger.js";

const logger = new Logger("lit");
export function createNewPKP(req: Request, res: Response): void {
  logger.log("Creating Lit PKP...");
  console.log(req.body);

  res.status(200).json({
    status: "ok",
  });
}
