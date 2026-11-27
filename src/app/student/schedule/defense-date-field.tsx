"use client";
// R6.9 (UX-P-06, R6-a A): the S4 defense date on the `date-picker` pattern. Days before the earliest date are blocked
// with the BR-09 reason; the server checks the date again (`proposeDefenseDate`). The form field `date` keeps the
// "yyyy-mm-dd" value that `proposeDateAction` reads.
import { useId, useState } from "react";
import { DatePicker, type DayKey } from "@/components/patterns/date-picker";

export function DefenseDateField({ earliest }: { earliest: Date }) {
  const id = useId();
  const [value, setValue] = useState<DayKey | null>(null);
  return <DatePicker id={id} label="Defense date" name="date" earliest={earliest} value={value} onChange={setValue} />;
}
