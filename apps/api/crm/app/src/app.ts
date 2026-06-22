import express from "express";
import cors from "cors";
import clientsRouter from "./routes/clients.route.js";
import projectsRouter from "./routes/projects.route.js";
import kahierLinkRouter from "./routes/kahier-link.route.js";
import { createInvoicesRouter } from "./routes/invoices.route.js";
import * as invoicesController from "./controllers/invoices.controller.js";

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

app.get("/health", (_req, res) => res.json({ ok: true, service: "crm-service" }));
app.use("/clients", clientsRouter);
app.use("/projects", projectsRouter);
app.use("/kahier-link", kahierLinkRouter);
app.use("/invoices", createInvoicesRouter(invoicesController));

export default app;
