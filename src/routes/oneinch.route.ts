import { Router } from "express";
import { test } from "../controllers/oneinch.controller";

class OneInchRoutes {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get("/", test);
  }
}

export default new OneInchRoutes().router;
