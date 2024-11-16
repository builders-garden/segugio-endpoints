import express from "express";
import { addAddressToScan, notifyTx } from "./quicknode.js";

const quickNodeRouter = express.Router();

quickNodeRouter.post("/addAddressToScan", addAddressToScan);
quickNodeRouter.post("/notifyTx", notifyTx);

export { quickNodeRouter };
