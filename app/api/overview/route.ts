import { getLumiereOverview, type RangeInput } from "@/lib/lumiere/queries";
import type { RangePreset } from "@/lib/lumiere/types";

// Always live — never statically prerendered.
export const dynamic = "force-dynamic";

const PRESETS: RangePreset[] = ["24h", "7d", "30d"];

function parseRange(url: URL): RangeInput {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from && to) {
    return { kind: "custom", from, to };
  }
  const preset = url.searchParams.get("range");
  if (preset && (PRESETS as string[]).includes(preset)) {
    return { kind: "preset", preset: preset as RangePreset };
  }
  return { kind: "preset", preset: "24h" };
}

export async function GET(request: Request) {
  try {
    const range = parseRange(new URL(request.url));
    const data = await getLumiereOverview(range);
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
