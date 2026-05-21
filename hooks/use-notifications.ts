'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { useDb } from './use-db'
import type { Database } from '@/types/database'

type NotificationChannel = Database['public']['Enums']['notification_channel']
type NotificationFrequency = Database['public']['Enums']['notification_frequency']
type PreferenceInsert = Database['public']['Tables']['notification_preferences']['Insert']
type PreferenceUpdate = Database['public']['Tables']['notification_preferences']['Update']
type EventInsert = Database['public']['Tables']['notification_events']['Insert']
type RecipientInsert = Database['public']['Tables']['notification_recipients']['Insert']
type InboxInsert = Database['public']['Tables']['notification_inbox']['Insert']

// ── Inbox ─────────────────────────────────────────────────────────────────────

export function useInbox(
  accountId: number | null,
  options?: { limit?: number; offset?: number; includeArchived?: boolean; groupKey?: string },
) {
  const db = useDb()
  return useSWR(
    accountId
      ? [
          'notifications',
          'inbox',
          accountId,
          options?.limit,
          options?.offset,
          options?.includeArchived,
          options?.groupKey,
        ]
      : null,
    async () => {
      const { data, error } = await db.notifications.listInbox(accountId!, options)
      if (error) throw error
      return data
    },
  )
}

export function useInboxItem(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['notifications', 'inboxItem', id] : null, async () => {
    const { data, error } = await db.notifications.getInboxItem(id!)
    if (error) throw error
    return data
  })
}

export function useUnreadCount() {
  const db = useDb()
  return useSWR(['notifications', 'unreadCount'], async () => {
    const { data, error } = await db.notifications.unreadCount()
    if (error) throw error
    return data
  })
}

// ── Events ────────────────────────────────────────────────────────────────────

export function useNotificationEvent(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['notifications', 'event', id] : null, async () => {
    const { data, error } = await db.notifications.getEvent(id!)
    if (error) throw error
    return data
  })
}

export function useNotificationEventsForOrg(
  orgId: number | null,
  options?: { type?: string; limit?: number },
) {
  const db = useDb()
  return useSWR(
    orgId ? ['notifications', 'eventsForOrg', orgId, options?.type, options?.limit] : null,
    async () => {
      const { data, error } = await db.notifications.listEventsForOrg(orgId!, options)
      if (error) throw error
      return data
    },
  )
}

export function useNotificationEventsForEntity(
  entityType: string | null,
  entityId: string | null,
) {
  const db = useDb()
  return useSWR(
    entityType && entityId
      ? ['notifications', 'eventsForEntity', entityType, entityId]
      : null,
    async () => {
      const { data, error } = await db.notifications.listEventsForEntity(
        entityType!,
        entityId!,
      )
      if (error) throw error
      return data
    },
  )
}

// ── Recipients ────────────────────────────────────────────────────────────────

export function useNotificationRecipient(id: number | null) {
  const db = useDb()
  return useSWR(id ? ['notifications', 'recipient', id] : null, async () => {
    const { data, error } = await db.notifications.getRecipient(id!)
    if (error) throw error
    return data
  })
}

export function useRecipientsForEvent(eventId: number | null) {
  const db = useDb()
  return useSWR(
    eventId ? ['notifications', 'recipientsForEvent', eventId] : null,
    async () => {
      const { data, error } = await db.notifications.listRecipientsForEvent(eventId!)
      if (error) throw error
      return data
    },
  )
}

// ── Deliveries ────────────────────────────────────────────────────────────────

export function useDeliveries(
  recipientId: number | null,
  options?: { channel?: NotificationChannel },
) {
  const db = useDb()
  return useSWR(
    recipientId ? ['notifications', 'deliveries', recipientId, options?.channel] : null,
    async () => {
      const { data, error } = await db.notifications.listDeliveries(recipientId!, options)
      if (error) throw error
      return data
    },
  )
}

// ── Preferences ───────────────────────────────────────────────────────────────

export function useNotificationPreferences(accountId: number | null) {
  const db = useDb()
  return useSWR(
    accountId ? ['notifications', 'preferences', accountId] : null,
    async () => {
      const { data, error } = await db.notifications.listPreferences(accountId!)
      if (error) throw error
      return data
    },
  )
}

export function useNotificationPreference(
  accountId: number | null,
  notificationType: string | null,
  channel: NotificationChannel | null,
) {
  const db = useDb()
  return useSWR(
    accountId && notificationType && channel
      ? ['notifications', 'preference', accountId, notificationType, channel]
      : null,
    async () => {
      const { data, error } = await db.notifications.getPreference(
        accountId!,
        notificationType!,
        channel!,
      )
      if (error) throw error
      return data
    },
  )
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function useNotificationTemplate(
  type: string | null,
  channel: NotificationChannel | null,
  locale = 'en',
) {
  const db = useDb()
  return useSWR(
    type && channel ? ['notifications', 'template', type, channel, locale] : null,
    async () => {
      const { data, error } = await db.notifications.getTemplate(type!, channel!, locale)
      if (error) throw error
      return data
    },
  )
}

export function useNotificationTemplates(options?: {
  type?: string
  channel?: NotificationChannel
}) {
  const db = useDb()
  return useSWR(
    ['notifications', 'templates', options?.type, options?.channel],
    async () => {
      const { data, error } = await db.notifications.listTemplates(options)
      if (error) throw error
      return data
    },
  )
}

// ── Digests ───────────────────────────────────────────────────────────────────

export function usePendingDigests(accountId: number | null) {
  const db = useDb()
  return useSWR(
    accountId ? ['notifications', 'pendingDigests', accountId] : null,
    async () => {
      const { data, error } = await db.notifications.listPendingDigests(accountId!)
      if (error) throw error
      return data
    },
  )
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useMarkNotificationRead() {
  const db = useDb()
  return useCallback((inboxId: number) => db.notifications.markRead(inboxId), [db])
}

export function useMarkAllNotificationsRead() {
  const db = useDb()
  return useCallback(() => db.notifications.markAllRead(), [db])
}

export function useArchiveNotification() {
  const db = useDb()
  return useCallback((inboxId: number) => db.notifications.archive(inboxId), [db])
}

export function useCreateNotificationEvent() {
  const db = useDb()
  return useCallback((data: EventInsert) => db.notifications.createEvent(data), [db])
}

export function useCreateNotificationRecipient() {
  const db = useDb()
  return useCallback(
    (data: RecipientInsert) => db.notifications.createRecipient(data),
    [db],
  )
}

export function useCreateInboxItem() {
  const db = useDb()
  return useCallback((data: InboxInsert) => db.notifications.createInboxItem(data), [db])
}

export function useUpsertNotificationPreference() {
  const db = useDb()
  return useCallback(
    (data: PreferenceInsert) => db.notifications.upsertPreference(data),
    [db],
  )
}

export function useUpdateNotificationPreference() {
  const db = useDb()
  return useCallback(
    (id: number, data: PreferenceUpdate) => db.notifications.updatePreference(id, data),
    [db],
  )
}

export function useDeleteNotificationPreference() {
  const db = useDb()
  return useCallback((id: number) => db.notifications.deletePreference(id), [db])
}

export function useSetChannelEnabled() {
  const db = useDb()
  return useCallback(
    (
      accountId: number,
      notificationType: string,
      channel: NotificationChannel,
      isEnabled: boolean,
      frequency?: NotificationFrequency,
    ) =>
      db.notifications.setChannelEnabled(
        accountId,
        notificationType,
        channel,
        isEnabled,
        frequency,
      ),
    [db],
  )
}
