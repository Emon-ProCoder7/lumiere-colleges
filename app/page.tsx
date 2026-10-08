import { getLumiereOverview } from "@/lib/lumiere/queries";
import { LumiereClient } from "@/components/LumiereClient";

// Always live — never statically prerendered, so build never has to reach the DB
// and every visit reflects the latest calls and voicemails.
export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getLumiereOverview();
  return <LumiereClient initialData={data} />;
}
