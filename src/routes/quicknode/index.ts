import express from "express";
import { addAddressToScan, notifyTx } from "./quicknode.js";

const quickNodeRouter = express.Router();

quickNodeRouter.post("/add-address-to-scan", addAddressToScan);
quickNodeRouter.post("/notify-tx", notifyTx);

export { quickNodeRouter };
