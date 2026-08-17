export function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
}
export function formatRelativeDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Not available";
  const days = Math.round((timestamp - Date.now()) / 86_400_000);
  if (Math.abs(days) < 1) return "Today";
  if (days === -1) return "Yesterday";
  if (days > -7 && days < 0) return `${Math.abs(days)} days ago`;
  return formatDate(value);
}
