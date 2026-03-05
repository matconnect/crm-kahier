import mariadb from "mariadb";

const COMPANY_TABLES = ["Company", "User"];
const CRM_TABLES = [
  "Company",
  "User",
  "Client",
  "ClientOwner",
  "ClientContact",
  "ClientInteraction",
  "ClientDocument",
  "_ClientInteractionCollaborators",
];

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function resolveConnectionUrl(kind) {
  const cli = getArg(kind);
  if (cli) return cli;

  const envMap = {
    source: process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL,
    company: process.env.COMPANY_DATABASE_URL,
    crm: process.env.CRM_DATABASE_URL,
  };

  const value = envMap[kind];
  if (!value) {
    throw new Error(`Missing required URL for ${kind}. Use --${kind} or env variable.`);
  }
  return value;
}

async function copyTables({ sourceConn, targetConn, tables, label }) {
  const sourceRows = await sourceConn.query("SHOW TABLES");
  const targetRows = await targetConn.query("SHOW TABLES");

  const sourceSet = new Set(sourceRows.map((row) => Object.values(row)[0]));
  const targetSet = new Set(targetRows.map((row) => Object.values(row)[0]));

  const selected = tables.filter((table) => sourceSet.has(table) && targetSet.has(table));

  if (selected.length === 0) {
    console.log(`[${label}] No matching tables to copy.`);
    return;
  }

  await targetConn.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const table of selected) {
      await targetConn.query(`TRUNCATE TABLE \`${table}\``);
      const rows = await sourceConn.query(`SELECT * FROM \`${table}\``);
      if (!rows.length) {
        console.log(`[${label}] ${table}: 0 rows`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const placeholders = `(${columns.map(() => "?").join(",")})`;
      const sql = `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(",")}) VALUES ${placeholders}`;

      for (const row of rows) {
        const values = columns.map((c) => row[c]);
        await targetConn.query(sql, values);
      }
      console.log(`[${label}] ${table}: ${rows.length} rows copied`);
    }
  } finally {
    await targetConn.query("SET FOREIGN_KEY_CHECKS = 1");
  }
}

async function main() {
  const sourceUrl = resolveConnectionUrl("source");
  const companyUrl = resolveConnectionUrl("company");
  const crmUrl = resolveConnectionUrl("crm");

  const sourceConn = await mariadb.createConnection(sourceUrl);
  const companyConn = await mariadb.createConnection(companyUrl);
  const crmConn = await mariadb.createConnection(crmUrl);

  try {
    await copyTables({
      sourceConn,
      targetConn: companyConn,
      tables: COMPANY_TABLES,
      label: "company-db",
    });

    await copyTables({
      sourceConn,
      targetConn: crmConn,
      tables: CRM_TABLES,
      label: "crm-db",
    });
  } finally {
    await sourceConn.end();
    await companyConn.end();
    await crmConn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
