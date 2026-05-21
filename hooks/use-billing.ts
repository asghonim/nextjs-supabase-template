'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { useDb } from './use-db'
import type { Database } from '@/types/database'

type InvoiceStatus = Database['public']['Enums']['invoice_status']
type PaymentStatus = Database['public']['Enums']['payment_status']
type BillingProvider = Database['public']['Enums']['billing_provider']
type WebhookInsert = Database['public']['Tables']['billing_webhook_events']['Insert']

// ── Invoices ──────────────────────────────────────────────────────────────────

export function useInvoices(
  orgId: number | null,
  options?: { status?: InvoiceStatus; limit?: number },
) {
  const db = useDb()
  return useSWR(
    orgId ? ['billing', 'invoices', orgId, options?.status, options?.limit] : null,
    async () => {
      const { data, error } = await db.billing.listInvoices(orgId!, options)
      if (error) throw error
      return data
    },
  )
}

export function useInvoice(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['billing', 'invoice', id] : null, async () => {
    const { data, error } = await db.billing.getInvoice(id!)
    if (error) throw error
    return data
  })
}

export function useInvoiceByNumber(number: string | null) {
  const db = useDb()
  return useSWR(number ? ['billing', 'invoiceByNumber', number] : null, async () => {
    const { data, error } = await db.billing.getInvoiceByNumber(number!)
    if (error) throw error
    return data
  })
}

export function useInvoiceByProviderId(providerInvoiceId: string | null) {
  const db = useDb()
  return useSWR(
    providerInvoiceId ? ['billing', 'invoiceByProviderId', providerInvoiceId] : null,
    async () => {
      const { data, error } = await db.billing.getInvoiceByProviderId(providerInvoiceId!)
      if (error) throw error
      return data
    },
  )
}

// ── Credit notes ──────────────────────────────────────────────────────────────

export function useCreditNotes(orgId: number | null) {
  const db = useDb()
  return useSWR(orgId ? ['billing', 'creditNotes', orgId] : null, async () => {
    const { data, error } = await db.billing.listCreditNotes(orgId!)
    if (error) throw error
    return data
  })
}

export function useCreditNote(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['billing', 'creditNote', id] : null, async () => {
    const { data, error } = await db.billing.getCreditNote(id!)
    if (error) throw error
    return data
  })
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function usePayments(
  orgId: number | null,
  options?: { status?: PaymentStatus; limit?: number },
) {
  const db = useDb()
  return useSWR(
    orgId ? ['billing', 'payments', orgId, options?.status, options?.limit] : null,
    async () => {
      const { data, error } = await db.billing.listPayments(orgId!, options)
      if (error) throw error
      return data
    },
  )
}

export function usePayment(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['billing', 'payment', id] : null, async () => {
    const { data, error } = await db.billing.getPayment(id!)
    if (error) throw error
    return data
  })
}

export function usePaymentByProviderId(providerPaymentId: string | null) {
  const db = useDb()
  return useSWR(
    providerPaymentId ? ['billing', 'paymentByProviderId', providerPaymentId] : null,
    async () => {
      const { data, error } = await db.billing.getPaymentByProviderId(providerPaymentId!)
      if (error) throw error
      return data
    },
  )
}

// ── Webhook events ────────────────────────────────────────────────────────────

export function useWebhookEvent(
  provider: BillingProvider | null,
  eventId: string | null,
) {
  const db = useDb()
  return useSWR(
    provider && eventId ? ['billing', 'webhookEvent', provider, eventId] : null,
    async () => {
      const { data, error } = await db.billing.getWebhookEvent(provider!, eventId!)
      if (error) throw error
      return data
    },
  )
}

export function usePendingWebhookEvents(provider?: BillingProvider) {
  const db = useDb()
  return useSWR(['billing', 'pendingWebhookEvents', provider], async () => {
    const { data, error } = await db.billing.listPendingWebhookEvents(provider)
    if (error) throw error
    return data
  })
}

// ── Idempotency keys ──────────────────────────────────────────────────────────

export function useIdempotencyKey(key: string | null) {
  const db = useDb()
  return useSWR(key ? ['billing', 'idempotencyKey', key] : null, async () => {
    const { data, error } = await db.billing.getIdempotencyKey(key!)
    if (error) throw error
    return data
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useUpsertWebhookEvent() {
  const db = useDb()
  return useCallback((data: WebhookInsert) => db.billing.upsertWebhookEvent(data), [db])
}
