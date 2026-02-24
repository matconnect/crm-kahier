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

const port = Number(process.env.PORT ?? 3011);
const { default: app } = await import("./app");

app.listen(port, () => {
  console.log(`[api-gateway] listening on :${port}`);
});
