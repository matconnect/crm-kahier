import path from "node:path";
import dotenv from "dotenv";

const candidateEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), "apps/api-gateway/.env"),
];

for (const envPath of candidateEnvPaths) {
  dotenv.config({ path: envPath, override: false });
}

dotenv.config();

const portRaw = process.env.PORT;
if (!portRaw) {
  throw new Error("Missing required environment variable: PORT");
}
const port = Number(portRaw);
if (!Number.isFinite(port)) {
  throw new Error(`Invalid PORT value: ${portRaw}`);
}
const { default: app } = await import("./app");

app.listen(port, () => {
  console.log(`[api-gateway] listening on :${port}`);
});
