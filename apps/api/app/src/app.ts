import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import router from "./routes/clients.route";
import profileRouter from "./routes/profile.route";
import companyRouter from "./routes/company.route";
import usersRouter from "./routes/users.route";
import kahierRouter from "./routes/kahier.route";

dotenv.config();

const splitUrls = (csv?: string) =>
    (csv ?? "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean)
        .map((u) => u.replace(/\/$/, ""));

const URLS_DEV = splitUrls(process.env.URL_DEV);
const URLS_PROD = splitUrls(process.env.URL_PROD);

const ORIGINS: string[] =
    process.env.NODE_ENV === "production" ? URLS_PROD : URLS_DEV;

const app = express();
export const server = http.createServer(app);

export const io = new Server(server, {
    cors: { origin: ORIGINS, methods: ["GET", "POST"], credentials: true },
    maxHttpBufferSize: 5e7,
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/clients", router);
app.use("/profile", profileRouter);
app.use("/company", companyRouter);
app.use("/users", usersRouter);
app.use("/kahier", kahierRouter);
