// Neon Auth API routes (FR-ACC-01). The browser auth client calls these.
import { getAuth } from "@/server/auth/neon-auth";

type Handlers = ReturnType<ReturnType<typeof getAuth>["handler"]>;
type Ctx = Parameters<Handlers["GET"]>[1];

const route = (method: keyof Handlers) => (request: Request, ctx: Ctx) =>
  getAuth().handler()[method](request, ctx);

export const GET = route("GET");
export const POST = route("POST");
export const PUT = route("PUT");
export const PATCH = route("PATCH");
export const DELETE = route("DELETE");
