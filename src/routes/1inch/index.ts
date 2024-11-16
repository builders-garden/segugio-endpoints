import express from "express";
import {
  getMultiPortfolio,
  getTokenDetails,
  getTokensData,
  generalProfitAndLoss,
  generalCurrentValue,
} from "./1inch.js";

const oneInchRouter = express.Router();

oneInchRouter.get("/multi-portfolio", getMultiPortfolio);
oneInchRouter.get("/token-details", getTokenDetails);
oneInchRouter.get("/tokens-data", getTokensData);
oneInchRouter.get("/profit-and-loss", generalProfitAndLoss);
oneInchRouter.get("/current-value", generalCurrentValue);

export { oneInchRouter };
