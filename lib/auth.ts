// Minimal single-user auth: a signed cookie, no session table, no user accounts.
// Works in both the Node API routes and the Edge middleware because it only
// uses Web Crypto (crypto.subtle), which is available in both runtimes.

const COOKIE_NAME = 'peds_logbook_auth';
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET env var is not set');
  return secret;
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Buffer.from(sig).toString('hex');
}

// Token = "<expiry-epoch-seconds>.<hmac(expiry)>"
export async function createAuthToken(): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + ONE_WEEK_SECONDS;
  const sig = await hmac(String(expiry));
  return `${expiry}.${sig}`;
}

export async function verifyAuthToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expiryStr, sig] = token.split('.');
  if (!expiryStr || !sig) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(expiryStr);
  return expected === sig;
}

export { COOKIE_NAME };
