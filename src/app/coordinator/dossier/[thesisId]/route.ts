// GET /coordinator/dossier/[thesisId]: the Student dossier as one JSON file (FR-DOC-10). Coordinator only.
import { getSessionState } from "@/server/auth/session";
import { AccessDeniedError } from "@/server/data/access";
import { getDb } from "@/server/data/db";
import { InputProblem } from "@/server/data/coordinator";
import { exportDossier } from "@/server/data/dossier";

export async function GET(_req: Request, { params }: RouteContext<"/coordinator/dossier/[thesisId]">): Promise<Response> {
  const state = await getSessionState();
  if (state.status !== "ok") return Response.json({ error: "Sign in first." }, { status: 401 });
  const { thesisId } = await params;
  try {
    const d = await exportDossier({ db: getDb(), actor: state.actor }, thesisId);
    return new Response(JSON.stringify(d, null, 2), {
      headers: { "content-type": "application/json", "content-disposition": `attachment; filename="dossier-${thesisId}.json"` },
    });
  } catch (e) {
    if (e instanceof AccessDeniedError) return Response.json({ error: e.message }, { status: 403 });
    if (e instanceof InputProblem) return Response.json({ error: e.message }, { status: 404 });
    throw e;
  }
}
