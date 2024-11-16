import type { Request, Response } from "express";
import { createSegugioSchema } from "../../utils/schemas/segugio.schema.js";
import { Logger } from "../../utils/logger.js";

const logger = new Logger("testHandler");
export function createSegugio(req: Request, res: Response): void {
  logger.log("Creating segugio...");
  const parsedBody = createSegugioSchema.safeParse(req.body);

  if (!parsedBody.success) {
    logger.error(`Error ${JSON.stringify(parsedBody.error.errors)}`);
    res.status(400).json({ error: parsedBody.error.errors });
  } else {
    logger.log(`Successfully parsed body ${JSON.stringify(parsedBody.data)}`);
    // TODO: create segugio
    // if no priv key for user address, create one
    // else, add to segugio list
    res.status(200).json({
      address: parsedBody.data.addressToFollow,
      message: `Successfully created segugio for ${parsedBody.data.addressToFollow}`,
    });
  }
}
