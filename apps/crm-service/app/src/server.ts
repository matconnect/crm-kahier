import path from "node:path";
import dotenv from "dotenv";

const candidateEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), "apps/crm-service/.env"),
];

for (const envPath of candidateEnvPaths) {
  dotenv.config({ path: envPath, override: false });
}

dotenv.config();

const { default: app } = await import("./app");

const portRaw = process.env.PORT;
if (!portRaw) {
  throw new Error("Missing required environment variable: PORT");
}
const port = Number(portRaw);
if (!Number.isFinite(port)) {
  throw new Error(`Invalid PORT value: ${portRaw}`);
}

app.listen(port, () => {
  console.log(`[crm-service] listening on :${port}`);
});
