import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-static";
export const dynamicParams = false;

const dir = path.join(process.cwd(), "content/puzzles");

export function generateStaticParams() {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({ date: file.replace(/\.json$/, "") }));
}

export async function GET(_request: Request, context: { params: Promise<{ date: string }> }) {
  const { date } = await context.params;
  return Response.json(JSON.parse(readFileSync(path.join(dir, `${date}.json`), "utf8")));
}
