// Members log in with a mobile number + password. Supabase Auth itself needs
// an email, so we deterministically map mobile -> a synthetic email under
// the hood, invisible to the user.
//
// IMPORTANT: this mapping MUST exactly match mobileToEmail() in
// supabase/functions/admin-manage-login/index.ts. If you change one,
// change the other, or existing logins will break.

/** Normalize any mobile input to local 11-digit Bangladeshi form, e.g. "01712345678". */
export function normalizeMobile(rawMobile: string): string {
  const digitsOnly = String(rawMobile || "").replace(/\D/g, "");
  let local = digitsOnly;
  if (local.startsWith("880")) local = "0" + local.slice(3);
  if (!local.startsWith("0") && local.length === 10) local = "0" + local;
  return local;
}

export function mobileToEmail(rawMobile: string): string {
  return `m${normalizeMobile(rawMobile)}@tgsbd.org`;
}

export function isValidMobile(rawMobile: string): boolean {
  const normalized = normalizeMobile(rawMobile);
  return /^0\d{10}$/.test(normalized);
}
