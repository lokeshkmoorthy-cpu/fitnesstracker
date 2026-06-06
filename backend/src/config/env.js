import path from "path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(repoRoot, "backend", ".env") });
function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3030,
  dbHost: process.env.DB_HOST || "",
  dbUser: process.env.DB_USER || "",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "",
  dbPort: Number(process.env.DB_PORT) || 3306,
  googleSheetId: process.env.GOOGLE_SHEET_ID || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || ""
};
function assertCriticalEnvForProduction() {
  if (env.nodeEnv !== "production") return;
  getRequiredEnv("GOOGLE_SHEET_ID");
}
export {
  assertCriticalEnvForProduction,
  env
};
