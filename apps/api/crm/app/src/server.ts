import path from "node:path";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";

const candidateEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), "apps/api/crm/.env"),
];

for (const envPath of candidateEnvPaths) {
  dotenv.config({ path: envPath, override: false });
}

dotenv.config();

const { default: app } = await import("./app.js");

const portFile = process.env.PORT_FILE;
const portFromFile = portFile ? readFileSync(portFile, "utf8").trim() : undefined;
const portRaw = process.env.PORT ?? portFromFile;
if (!portRaw) throw new Error("Missing required environment variable: PORT or PORT_FILE");
const port = Number(portRaw);
if (!Number.isFinite(port)) {
  throw new Error(`Invalid PORT value: ${portRaw}`);
}

app.listen(port, () => {
  console.log(`[crm-service] listening on :${port}`);
});
