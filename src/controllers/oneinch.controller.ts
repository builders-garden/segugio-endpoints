import type { Request, Response } from "express";

export function test(req: Request, res: Response) {
  res.send("1inch controller 4");
}
