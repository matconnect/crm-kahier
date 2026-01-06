import path from "node:path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), "../../.env");
dotenv.config({ path: envPath });
dotenv.config();

const { server } = await import("./app");

const PORT = process.env.PORT;
const URL_DEV = process.env.URL_DEV;
const URL_PROD = process.env.URL_PROD;
const RAW_URL = process.env.NODE_ENV === "production" ? URL_PROD : URL_DEV;

const URL = RAW_URL?.replace(/:\d+$/, "");

server.listen(PORT, () => {
    console.log(`🚀 Serveur allumé sur : ${URL}:${PORT}`);
});
