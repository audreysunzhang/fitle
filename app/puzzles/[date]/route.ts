import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-static";
export const dynamicParams = false;

const dir = path.join(process.cwd(), "content/puzzles");
const overridesFile = path.join(process.cwd(), "content/local/overrides.json");

/** Optional, git-ignored per-item overrides for private local demos. */
function localOverrides(): Record<string, object> {
  if (process.env.NO_LOCAL_CONTENT || !existsSync(overridesFile)) return {};
  return JSON.parse(readFileSync(overridesFile, "utf8"));
}

export function generateStaticParams() {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({ date: file.replace(/\.json$/, "") }));
}

export async function GET(_request: Request, context: { params: Promise<{ date: string }> }) {
  const { date } = await context.params;
  const puzzle = JSON.parse(readFileSync(path.join(dir, `${date}.json`), "utf8"));
  const overrides = localOverrides();
  puzzle.items = puzzle.items.map((item: { id: string }) => ({ ...item, ...overrides[item.id] }));
  return Response.json(puzzle);
}
