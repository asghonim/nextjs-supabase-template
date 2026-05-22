import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getResend } from '@/lib/resend'
import { fetchTemplate, render } from './templates'



// ── Fallback templates (used when DB has no matching row) ─────────────────────

const FALLBACK_ADMIN_SUBJECT = '[Contact] {{subject}} — from {{submitter_name}}'

const FALLBACK_ADMIN_BODY = `<h2>New Contact Submission</h2>
<table cellpadding="6" style="border-collapse:collapse">
  <tr><td><strong>Name</strong></td><td>{{submitter_name}}</td></tr>
  <tr><td><strong>Email</strong></td><td>{{submitter_email}}</td></tr>
  <tr><td><strong>Subject</strong></td><td>{{subject}}</td></tr>
  <tr><td><strong>Category</strong></td><td>{{category}}</td></tr>
  <tr><td><strong>Time</strong></td><td>{{created_at}}</td></tr>
  <tr><td><strong>ID</strong></td><td>{{submission_id}}</td></tr>
</table>
<hr/>
<p style="white-space:pre-wrap">{{message}}</p>`

const FALLBACK_AUTO_RESPONSE_SUBJECT = "We've received your message"

const FALLBACK_AUTO_RESPONSE_BODY = `<p>Hi {{name}},</p>
<p>Thank you for reaching out. We've received your message and will get back to you as soon as possible.</p>
<p>Best regards,<br>The Support Team</p>`

// ── Public API ────────────────────────────────────────────────────────────────

export interface ContactNotificationPayload {
  submissionId: string
  fullName:     string | null
  email:        string | null
  subject:      string | null
  message:      string
  category:     string | null
  createdAt:    string
}

export async function sendAdminNotification(
  supabase: SupabaseClient<Database>,
  payload: ContactNotificationPayload,
): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const to = process.env.CONTACT_NOTIFICATION_EMAIL
  if (!to) return

  const vars: Record<string, string> = {
    submitter_name:  payload.fullName  ?? 'Anonymous',
    submitter_email: payload.email     ?? 'no email',
    subject:         payload.subject   ?? '(no subject)',
    category:        payload.category  ?? 'general',
    message:         payload.message.replace(/</g, '&lt;'),
    submission_id:   payload.submissionId,
    created_at:      payload.createdAt,
  }

  const tpl = await fetchTemplate(supabase, 'contact_submission.admin_notification')

  const subject = render(tpl?.subject ?? FALLBACK_ADMIN_SUBJECT, vars)
  const html    = render(tpl?.body    ?? FALLBACK_ADMIN_BODY,    vars)
  const from    = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com'

  await resend.emails.send({ from, to, subject, html })
}

export async function sendAutoResponse(
  supabase: SupabaseClient<Database>,
  to: string,
  fullName: string | null,
): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const vars: Record<string, string> = {
    name: fullName ?? 'there',
  }

  const tpl = await fetchTemplate(supabase, 'contact_submission.auto_response')

  const subject = render(tpl?.subject ?? FALLBACK_AUTO_RESPONSE_SUBJECT, vars)
  const html    = render(tpl?.body    ?? FALLBACK_AUTO_RESPONSE_BODY,    vars)
  const from    = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com'

  await resend.emails.send({ from, to, subject, html })
}
