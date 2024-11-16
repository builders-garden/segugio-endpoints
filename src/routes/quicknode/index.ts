import express from "express";
import { addAddressToScan } from "./quicknode.js";

const quickNodeRouter = express.Router();

quickNodeRouter.post("/addAddressToScan", addAddressToScan);

export { quickNodeRouter };
