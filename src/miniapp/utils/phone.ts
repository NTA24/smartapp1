export function formatPhone(phone: string): string {
  const raw = String(phone || "").trim();
  if (!raw) return "";

  let digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";

  while (digits.startsWith("84")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  while (digits.startsWith("84")) digits = digits.slice(2);

  return `(+84) ${digits}`;
}
