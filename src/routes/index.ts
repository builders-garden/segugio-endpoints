import type { Application } from "express";
import oneInchRoutes from "./oneinch.route";

export default class Routes {
  constructor(app: Application) {
    app.use("/1inch", oneInchRoutes);
  }
}
