import express from "express";
import cors from "cors";
import companyBillingRouter from "./routes/company-billing.route.js";
import registerBillingRouter from "./routes/register-billing.route.js";
import stripeWebhookRouter from "./routes/stripe-webhook.route.js";
import { splitUrls } from "./lib/env.js";

const urlDev = splitUrls(process.env.URL_DEV);
const urlProd = splitUrls(process.env.URL_PROD);
const origins = process.env.NODE_ENV === "production" ? urlProd : urlDev;

const app: express.Express = express();

app.use(cors({ origin: origins.length ? origins : true, credentials: true }));
app.use("/billing/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "billing-service" }));
app.use("/billing", registerBillingRouter);
app.use("/billing", companyBillingRouter);

export default app;
