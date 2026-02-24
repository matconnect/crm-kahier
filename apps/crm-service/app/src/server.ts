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

const port = Number(process.env.PORT ?? 3021);

app.listen(port, () => {
  console.log(`[crm-service] listening on :${port}`);
});
