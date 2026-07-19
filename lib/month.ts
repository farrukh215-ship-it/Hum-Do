export function getMonthStartISO(date: Date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

export type MonthRange = {
  param: string;
  startISO: string;
  endISO: string;
  prevParam: string;
  nextParam: string;
  isCurrentMonth: boolean;
};

/** monthParam is "YYYY-MM"; defaults to the current month if omitted/invalid. */
export function getMonthRange(monthParam?: string): MonthRange {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const current = new Date(now.getFullYear(), now.getMonth(), 1);

  const toParam = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  return {
    param: toParam(start),
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    prevParam: toParam(prev),
    nextParam: toParam(next),
    isCurrentMonth: start.getTime() === current.getTime(),
  };
}

export type CustomRange = { startISO: string; endISO: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** from/to are "YYYY-MM-DD" date-input values. Returns null if either is missing/invalid. */
export function getCustomDateRange(from?: string, to?: string): CustomRange | null {
  if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to)) return null;

  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);

  const a = new Date(fy, fm - 1, fd);
  const b = new Date(ty, tm - 1, td);

  const [start, end] = a.getTime() <= b.getTime() ? [a, b] : [b, a];
  const endExclusive = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);

  return { startISO: start.toISOString(), endISO: endExclusive.toISOString() };
}
