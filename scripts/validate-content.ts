import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateContent, type ContentFile } from "../lib/content/validate";
import { localDateKey } from "../lib/game/date";

const dir = path.join(process.cwd(), "content/puzzles");
const parseErrors: string[] = [];
const files: ContentFile[] = [];

for (const name of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  try {
    files.push({ name, data: JSON.parse(readFileSync(path.join(dir, name), "utf8")) });
  } catch (error) {
    parseErrors.push(`${name}: invalid JSON (${(error as Error).message})`);
  }
}

const { errors, warnings } = validateContent(files, localDateKey(new Date()));
warnings.forEach((w) => console.warn(`warning: ${w}`));
[...parseErrors, ...errors].forEach((e) => console.error(`error: ${e}`));

if (parseErrors.length + errors.length > 0) process.exit(1);
console.log(`Content OK: ${files.length} puzzle file(s), ${warnings.length} warning(s).`);
