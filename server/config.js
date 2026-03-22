import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = resolve(__dirname, "../data");
export const DIST_DIR = resolve(__dirname, "../dashboard/dist");
export const DATA_FILE = resolve(DATA_DIR, "order-details.json");
export const COOKIE_FILE = resolve(DATA_DIR, "cookies.json");
export const CREDENTIALS_FILE = resolve(DATA_DIR, "credentials.json");
export const DB_PATH = resolve(DATA_DIR, "vibebag.db");

export const BGN_TO_EUR = 1.95583;
export const PORT = process.env.PORT || 3001;
