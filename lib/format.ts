export function formatRs(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rs ${Math.abs(Math.round(amount)).toLocaleString("en-US")}`;
}
