// Dates in Philippine Standard Time, in one format (DESIGN.md §4.2, NFR-11, UX-021).
// Example: "Tue 12 Jan 2027, 09:00 PHT". Labels say "PHT", never "PST" (Pacific Standard Time).

const parts = (d: Date) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Manila",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.weekday} ${p.day} ${p.month} ${p.year}`, time: `${p.hour}:${p.minute}` };
};

/** "Tue 12 Jan 2027" */
export const formatPhtDate = (d: Date) => parts(d).date;

/** "Tue 12 Jan 2027, 09:00 PHT" */
export const formatPht = (d: Date) => {
  const { date, time } = parts(d);
  return `${date}, ${time} PHT`;
};

/** "Tue 12 Jan 2027, 09:00 to 10:00 PHT". A range over two days writes both dates. */
export const formatPhtRange = (a: Date, b: Date) => {
  const x = parts(a);
  const y = parts(b);
  return x.date === y.date ? `${x.date}, ${x.time} to ${y.time} PHT` : `${x.date}, ${x.time} to ${y.date}, ${y.time} PHT`;
};
