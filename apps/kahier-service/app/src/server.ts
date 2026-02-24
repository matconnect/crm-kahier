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

const port = Number(process.env.PORT ?? 3023);

app.listen(port, () => {
  console.log(`[kahier-service] listening on :${port}`);
});
