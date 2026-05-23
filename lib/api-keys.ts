import crypto from 'crypto'

const KEY_PREFIX = 'sk_live_'
/** Number of chars from the full key stored for display (prefix + 8 random chars). */
const DISPLAY_PREFIX_LENGTH = KEY_PREFIX.length + 8

export interface GeneratedApiKey {
  /** Full plaintext key — shown ONCE, never stored. */
  key: string
  /** SHA-256 hex digest — stored in the database. */
  hash: string
  /** First {@link DISPLAY_PREFIX_LENGTH} chars — stored for display. */
  prefix: string
}

/** Generates a new API key. The plaintext `key` must be shown to the user immediately and never persisted. */
export function generateApiKey(): GeneratedApiKey {
  const random = crypto.randomBytes(32).toString('base64url')
  const key = `${KEY_PREFIX}${random}`
  return {
    key,
    hash: hashApiKey(key),
    prefix: key.substring(0, DISPLAY_PREFIX_LENGTH),
  }
}

/** Computes the SHA-256 hex digest of a key string. Used for lookups. */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
