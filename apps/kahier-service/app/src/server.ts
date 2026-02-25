import path from "node:path";
import dotenv from "dotenv";
import app from "./app";

const candidateEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), "apps/kahier-service/.env"),
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

app.listen(port, () => {
  console.log(`[kahier-service] listening on :${port}`);
});
