import type { Request, Response } from "express";
import { createSegugioSchema } from "../schemas/segugio.schema";

export function createSegugio(req: Request, res: Response): void {
  console.log("Creating segugio...");
  const parsedBody = createSegugioSchema.safeParse(req.body);

  if (!parsedBody.success) {
    console.log("Error", parsedBody.error.errors);
    res.status(400).json({ error: parsedBody.error.errors });
  } else {
    console.log("Successfully parsed body", parsedBody.data);
    res.send("Successfully created segugio for limone.eth");
  }
}
