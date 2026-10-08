import { getLumiereOverview } from "@/lib/lumiere/queries";

// Always live — never statically prerendered.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLumiereOverview();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
