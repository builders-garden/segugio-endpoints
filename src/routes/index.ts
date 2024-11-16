import type { Application } from "express";
import oneInchRoutes from "./oneinch.route";
import segugioRoutes from "./segugio.route";

export default class Routes {
  constructor(app: Application) {
    app.use("/1inch", oneInchRoutes);
    app.use("/segugio", segugioRoutes);
  }
}
