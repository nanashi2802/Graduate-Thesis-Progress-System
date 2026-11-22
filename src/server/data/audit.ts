// The audit insert (NFR-03, INV-08, BR-19, AD-A-014). Server only.
// Pass the transaction of the write as `ctx.db`, so the audit row commits with the change.
import "server-only";
import { requireActive, type DataContext } from "./access";
import { auditRecord } from "./schema";

export const AUDIT_TEXT_MAX = 200;

export type AuditValue = string | number | boolean | null;

export type AuditEntry = {
  action: string;
  targetTable: string;
  targetId?: string | null;
  detail?: Record<string, AuditValue>;
};

export class AuditDetailError extends Error {
  constructor(key: string) {
    super(`Audit detail "${key}" must be a short string, a number, a boolean or null.`);
    this.name = "AuditDetailError";
  }
}

// No long text and no nested values: the audit table never holds manuscript text (AD-A-014).
function checkDetail(detail: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(detail)) {
    const okValue =
      value === null ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      (typeof value === "string" && value.length <= AUDIT_TEXT_MAX);
    if (!okValue) throw new AuditDetailError(key);
  }
}

export async function recordAudit(ctx: DataContext, entry: AuditEntry): Promise<void> {
  requireActive(ctx.actor);
  if (entry.detail) checkDetail(entry.detail);
  await ctx.db.insert(auditRecord).values({
    actorUserId: ctx.actor.userId,
    actorRole: ctx.actor.role,
    action: entry.action,
    targetTable: entry.targetTable,
    targetId: entry.targetId ?? null,
    detail: entry.detail ?? null,
  });
}
