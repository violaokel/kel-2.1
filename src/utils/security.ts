/**
 * Security utilities for hashing and verifying passwords in client-side Supabase integrations.
 */

export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, storedHashOrPlaintext: string): Promise<boolean> {
  if (!storedHashOrPlaintext) return false;
  // If stored value looks like a SHA-256 hash (64 hex characters)
  const isHash = /^[0-9a-f]{64}$/i.test(storedHashOrPlaintext);
  if (isHash) {
    const inputHash = await hashPassword(password);
    return inputHash === storedHashOrPlaintext;
  }
  // Fallback to plaintext comparison for legacy accounts
  return password === storedHashOrPlaintext;
}
