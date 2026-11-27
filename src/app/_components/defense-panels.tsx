"use client";
// R6.9 (UX-P-06): the A5 and P4 client parts on the R6 patterns. They keep the server actions (`saveSheetAction`,
// `recordVerdictAction`) and refresh the page after a saved action, as `ActionForm` did. FR-DEF-05 to FR-DEF-07.
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Result } from "@/app/_lib/run";
import { DefenseForm, type DefenseFormProps } from "@/components/patterns/defense-form";
import { Verdict, type VerdictProps, type VerdictValue } from "@/components/patterns/verdict";

export function DefenseSheet({ save, ...props }: Omit<DefenseFormProps, "onSave"> & { save: (form: FormData) => Promise<Result> }) {
  const router = useRouter();
  return (
    <DefenseForm
      {...props}
      onSave={async (data) => {
        const res = await save(data);
        if (res.ok) router.refresh();
        return { ok: res.ok === true, error: res.error };
      }}
    />
  );
}

export function VerdictPanel({ record, ...props }: Omit<VerdictProps, "onRefresh" | "onRecord"> & { record: (form: FormData) => Promise<Result> }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  return (
    <Verdict
      {...props}
      onRefresh={refresh}
      onRecord={async (verdict: VerdictValue) => {
        const form = new FormData();
        form.set("verdict", verdict);
        const res = await record(form);
        if (!res.ok) return { error: res.error ?? "The verdict was not recorded. Try again." };
        router.refresh();
      }}
    />
  );
}
