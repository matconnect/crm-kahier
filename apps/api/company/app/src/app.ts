import express from "express";
import cors from "cors";
import companyRouter from "./routes/company.route.js";
import usersRouter from "./routes/users.route.js";
import profileRouter from "./routes/profile.route.js";
import internalRouter from "./routes/internal.route.js";
import authRouter from "./routes/auth.route.js";

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

app.get("/health", (_req, res) => res.json({ ok: true, service: "company-service" }));
app.use("/company", companyRouter);
app.use("/users", usersRouter);
app.use("/profile", profileRouter);
app.use("/internal", internalRouter);
app.use("/auth", authRouter);

export default app;
