import type { Request, Response } from "express";

export function createTransaction(_: Request, res: Response) {
  res.send("1inch controller");
}
