import { Router } from "express";
import { createSegugio } from "../controllers/segugio.controller";

class TxRoutes {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post("/create", createSegugio);
  }
}

export default new TxRoutes().router;
