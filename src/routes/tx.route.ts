import { Router } from "express";
import { txIndex } from "../controllers/tx.controller";

class TxRoutes {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post("/", txIndex);
  }
}

export default new TxRoutes().router;
