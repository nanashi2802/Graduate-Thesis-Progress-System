// Shared checks for Coordinator-only writes (FR-ACC-05, FR-TPL-01, NFR-01). Server only.
import "server-only";
import { AccessDeniedError, requireActive, type DataContext } from "./access";

export function requireCoordinator(ctx: DataContext, what: string): void {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator") throw new AccessDeniedError(`only the Coordinator ${what}`);
}

// A refusal that the screen shows to the user as it is (BR-18).
export class InputProblem extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "InputProblem";
  }
}
