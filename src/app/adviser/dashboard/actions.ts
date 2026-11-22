"use server";
// A1 action: the Adviser approves data gathering after the Certification (FR-WFL-11). The data layer checks the role (NFR-01).
import { field, run, type Result } from "@/app/_lib/run";
import { approveDataGathering } from "@/server/data/certification";

export async function approveDataGatheringAction(form: FormData): Promise<Result> {
  return run((ctx) => approveDataGathering(ctx, field(form, "milestoneId")));
}
