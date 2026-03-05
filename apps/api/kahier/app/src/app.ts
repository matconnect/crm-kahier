import express from "express";
import cors from "cors";
import kahierRouter from "./routes/kahier.route";

const splitUrls = (csv?: string) =>
  (csv ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => u.replace(/\/$/, ""));

const urlDev = splitUrls(process.env.URL_DEV);
const urlProd = splitUrls(process.env.URL_PROD);
const origins = process.env.NODE_ENV === "production" ? urlProd : urlDev;

const app: express.Express = express();

app.use(cors({ origin: origins.length ? origins : true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "kahier-service" }));
app.use("/kahier", kahierRouter);

export default app;
