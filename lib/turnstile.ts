const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
  // If not configured, skip verification (dev / self-hosted environments)
  if (!secret) return true

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)

  const res = await fetch(VERIFY_URL, { method: 'POST', body: form })
  const data = await res.json() as { success: boolean }
  return data.success === true
}
