// Philippine Standard Time text for dates (NFR-11).
export const pst = (d: Date) => d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
export const pstRange = (a: Date, b: Date) =>
  `${a.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" })} to ${b.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", timeStyle: "short" })}`;
export const SLOT_STATUS = { available: "Open", pending: "Requested", confirmed: "Confirmed" } as const;
export const MODE = { in_person: "In person", online: "Online" } as const;
