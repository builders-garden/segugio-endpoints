import { env } from "./env.js";
import express, { type Application } from "express";
import cors, { type CorsOptions } from "cors";
import {
  litRouter,
  oneInchRouter,
  segugioRouter,
  utilsRouter,
} from "./routes/index.js";
import { LitNetwork } from "@lit-protocol/constants";
import * as LitJsSdk from "@lit-protocol/lit-node-client";

const corsOptions: CorsOptions = {
  origin: "http://localhost:8081",
};

export const app: Application = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/", utilsRouter);
app.use("/1inch", oneInchRouter);
app.use("/segugio", segugioRouter);
app.use("/lit", litRouter);

app.locals.litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
  alertWhenUnauthorized: false,
  litNetwork: LitNetwork.DatilDev,
  connectTimeout: 100000,
});
await app.locals.litNodeClient.connect();
console.log("Lit connected");

app
  .listen(env.PORT, async () => {
    console.log(`⚡️ segugio-backend running on port ${env.PORT}`);
  })
  .on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.log("Error: address already in use");
    } else {
      console.log(err);
    }
  });
