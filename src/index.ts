import { env } from "./env.js";
import express, { type Application } from "express";
import cors, { type CorsOptions } from "cors";
import { oneInchRouter, segugioRouter, utilsRouter, quickNodeRouter } from "./routes/index.js";

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
app.use("/quicknode", quickNodeRouter);

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
