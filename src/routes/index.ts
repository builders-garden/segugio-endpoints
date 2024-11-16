import type { Application } from "express";
import oneInchRoutes from "./oneinch.route";
import txRoutes from "./tx.route";

export default class Routes {
  constructor(app: Application) {
    app.use("/1inch", oneInchRoutes);
    app.use("/tx", txRoutes);
  }
}
