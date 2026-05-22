// Replaces {{variable}} tokens in a template string.

import { Database } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

// Unrecognised tokens are left as-is so missing vars are visible in output.
export function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match)
}

export async function fetchTemplate(
  supabase: SupabaseClient<Database>,
  type: string,
  locale = 'en',
): Promise<{ subject: string | null; body: string } | null> {
  const { data } = await supabase
    .from('notification_templates')
    .select('subject_template, body_template')
    .eq('type', type)
    .eq('channel', 'email')
    .eq('locale', locale)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  return { subject: data.subject_template, body: data.body_template }
}