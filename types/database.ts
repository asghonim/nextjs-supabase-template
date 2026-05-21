export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          id: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      addon_feature_entitlements: {
        Row: {
          addon_version_id: number
          created_at: string
          feature_id: number
          id: number
          reset_period: Database["public"]["Enums"]["feature_reset_period"]
          value_boolean: boolean | null
          value_limit: number | null
        }
        Insert: {
          addon_version_id: number
          created_at?: string
          feature_id: number
          id?: never
          reset_period?: Database["public"]["Enums"]["feature_reset_period"]
          value_boolean?: boolean | null
          value_limit?: number | null
        }
        Update: {
          addon_version_id?: number
          created_at?: string
          feature_id?: number
          id?: never
          reset_period?: Database["public"]["Enums"]["feature_reset_period"]
          value_boolean?: boolean | null
          value_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "addon_feature_entitlements_addon_version_id_fkey"
            columns: ["addon_version_id"]
            isOneToOne: false
            referencedRelation: "addon_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_feature_entitlements_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      addon_versions: {
        Row: {
          addon_id: number
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          billing_provider_price_id: string | null
          created_at: string
          currency: string
          effective_from: string
          id: number
          is_active: boolean
          price_amount: number
        }
        Insert: {
          addon_id: number
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          billing_provider_price_id?: string | null
          created_at?: string
          currency?: string
          effective_from?: string
          id?: never
          is_active?: boolean
          price_amount: number
        }
        Update: {
          addon_id?: number
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          billing_provider_price_id?: string | null
          created_at?: string
          currency?: string
          effective_from?: string
          id?: never
          is_active?: boolean
          price_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "addon_versions_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
        ]
      }
      addons: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_webhook_events: {
        Row: {
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          created_at: string
          event_id: string
          event_type: string
          failure_reason: string | null
          id: number
          payload: Json
          processed_at: string | null
          retry_count: number
          status: Database["public"]["Enums"]["webhook_event_status"]
        }
        Insert: {
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          created_at?: string
          event_id: string
          event_type: string
          failure_reason?: string | null
          id?: never
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["webhook_event_status"]
        }
        Update: {
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          created_at?: string
          event_id?: string
          event_type?: string
          failure_reason?: string | null
          id?: never
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["webhook_event_status"]
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          billing_provider_credit_note_id: string | null
          created_at: string
          currency: string
          id: number
          invoice_id: number
          number: string | null
          organization_id: number
          reason: Database["public"]["Enums"]["credit_note_reason"]
          status: Database["public"]["Enums"]["credit_note_status"]
          total_amount: number
          voided_at: string | null
        }
        Insert: {
          billing_provider_credit_note_id?: string | null
          created_at?: string
          currency?: string
          id?: never
          invoice_id: number
          number?: string | null
          organization_id: number
          reason: Database["public"]["Enums"]["credit_note_reason"]
          status?: Database["public"]["Enums"]["credit_note_status"]
          total_amount?: number
          voided_at?: string | null
        }
        Update: {
          billing_provider_credit_note_id?: string | null
          created_at?: string
          currency?: string
          id?: never
          invoice_id?: number
          number?: string | null
          organization_id?: number
          reason?: Database["public"]["Enums"]["credit_note_reason"]
          status?: Database["public"]["Enums"]["credit_note_status"]
          total_amount?: number
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          key: string
          name: string
          type: Database["public"]["Enums"]["feature_type"]
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          key: string
          name: string
          type: Database["public"]["Enums"]["feature_type"]
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          key?: string
          name?: string
          type?: Database["public"]["Enums"]["feature_type"]
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          locked_at: string | null
          request_hash: string
          request_path: string
          response_body: Json | null
          response_status: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key: string
          locked_at?: string | null
          request_hash: string
          request_path: string
          response_body?: Json | null
          response_status?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          locked_at?: string | null
          request_hash?: string
          request_path?: string
          response_body?: Json | null
          response_status?: number | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          billing_provider_line_item_id: string | null
          created_at: string
          description: string
          id: number
          invoice_id: number
          metadata: Json
          period_end: string | null
          period_start: string | null
          quantity: number
          snapshot_feature_key: string | null
          snapshot_plan_name: string | null
          total_amount: number
          type: string
          unit_amount: number
        }
        Insert: {
          billing_provider_line_item_id?: string | null
          created_at?: string
          description: string
          id?: never
          invoice_id: number
          metadata?: Json
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          snapshot_feature_key?: string | null
          snapshot_plan_name?: string | null
          total_amount?: number
          type: string
          unit_amount?: number
        }
        Update: {
          billing_provider_line_item_id?: string | null
          created_at?: string
          description?: string
          id?: never
          invoice_id?: number
          metadata?: Json
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          snapshot_feature_key?: string | null
          snapshot_plan_name?: string | null
          total_amount?: number
          type?: string
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          billing_provider:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_invoice_id: string | null
          billing_reason: Database["public"]["Enums"]["billing_reason"] | null
          created_at: string
          currency: string
          discount_amount: number
          due_date: string | null
          id: number
          idempotency_key: string | null
          metadata: Json
          number: string | null
          organization_id: number
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          snapshot_customer_address: Json | null
          snapshot_customer_email: string | null
          snapshot_customer_name: string | null
          snapshot_plan_name: string | null
          snapshot_tax_rates: Json
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: number | null
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
          voided_at: string | null
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          billing_provider?:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_invoice_id?: string | null
          billing_reason?: Database["public"]["Enums"]["billing_reason"] | null
          created_at?: string
          currency?: string
          discount_amount?: number
          due_date?: string | null
          id?: never
          idempotency_key?: string | null
          metadata?: Json
          number?: string | null
          organization_id: number
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          snapshot_customer_address?: Json | null
          snapshot_customer_email?: string | null
          snapshot_customer_name?: string | null
          snapshot_plan_name?: string | null
          snapshot_tax_rates?: Json
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: number | null
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
          voided_at?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          billing_provider?:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_invoice_id?: string | null
          billing_reason?: Database["public"]["Enums"]["billing_reason"] | null
          created_at?: string
          currency?: string
          discount_amount?: number
          due_date?: string | null
          id?: never
          idempotency_key?: string | null
          metadata?: Json
          number?: string | null
          organization_id?: number
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          snapshot_customer_address?: Json | null
          snapshot_customer_email?: string | null
          snapshot_customer_name?: string | null
          snapshot_plan_name?: string | null
          snapshot_tax_rates?: Json
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: number | null
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          account_id: number
          created_at: string
          id: number
          invited_by_account_id: number | null
          joined_at: string
          organization_id: number
          role: Database["public"]["Enums"]["org_member_role"]
        }
        Insert: {
          account_id: number
          created_at?: string
          id?: never
          invited_by_account_id?: number | null
          joined_at?: string
          organization_id: number
          role?: Database["public"]["Enums"]["org_member_role"]
        }
        Update: {
          account_id?: number
          created_at?: string
          id?: never
          invited_by_account_id?: number | null
          joined_at?: string
          organization_id?: number
          role?: Database["public"]["Enums"]["org_member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_invited_by_account_id_fkey"
            columns: ["invited_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          billing_provider:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_customer_id: string | null
          created_at: string
          id: number
          metadata: Json
          name: string
          owner_account_id: number
          slug: string
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          billing_provider?:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_customer_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          name: string
          owner_account_id: number
          slug: string
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          billing_provider?:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_customer_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          name?: string
          owner_account_id?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_account_id_fkey"
            columns: ["owner_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          amount_refunded: number
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          billing_provider_payment_id: string | null
          billing_provider_payment_method_id: string | null
          created_at: string
          currency: string
          failure_code: string | null
          failure_reason: string | null
          id: number
          invoice_id: number | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"] | null
          organization_id: number
          processed_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          amount_refunded?: number
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          billing_provider_payment_id?: string | null
          billing_provider_payment_method_id?: string | null
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: never
          invoice_id?: number | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          organization_id: number
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_refunded?: number
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          billing_provider_payment_id?: string | null
          billing_provider_payment_method_id?: string | null
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: never
          invoice_id?: number | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          organization_id?: number
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_feature_entitlements: {
        Row: {
          created_at: string
          feature_id: number
          id: number
          plan_version_id: number
          reset_period: Database["public"]["Enums"]["feature_reset_period"]
          value_boolean: boolean | null
          value_limit: number | null
        }
        Insert: {
          created_at?: string
          feature_id: number
          id?: never
          plan_version_id: number
          reset_period?: Database["public"]["Enums"]["feature_reset_period"]
          value_boolean?: boolean | null
          value_limit?: number | null
        }
        Update: {
          created_at?: string
          feature_id?: number
          id?: never
          plan_version_id?: number
          reset_period?: Database["public"]["Enums"]["feature_reset_period"]
          value_boolean?: boolean | null
          value_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_feature_entitlements_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_feature_entitlements_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_versions: {
        Row: {
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          billing_provider:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_plan_id: string | null
          billing_provider_price_id: string | null
          created_at: string
          currency: string
          effective_from: string
          effective_until: string | null
          id: number
          is_active: boolean
          metadata: Json
          plan_id: number
          price_amount: number
          trial_days: number
          version_number: number
        }
        Insert: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          billing_provider?:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_plan_id?: string | null
          billing_provider_price_id?: string | null
          created_at?: string
          currency?: string
          effective_from?: string
          effective_until?: string | null
          id?: never
          is_active?: boolean
          metadata?: Json
          plan_id: number
          price_amount?: number
          trial_days?: number
          version_number?: number
        }
        Update: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          billing_provider?:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_plan_id?: string | null
          billing_provider_price_id?: string | null
          created_at?: string
          currency?: string
          effective_from?: string
          effective_until?: string | null
          id?: never
          is_active?: boolean
          metadata?: Json
          plan_id?: number
          price_amount?: number
          trial_days?: number
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          is_public: boolean
          metadata: Json
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          is_public?: boolean
          metadata?: Json
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          is_public?: boolean
          metadata?: Json
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_addons: {
        Row: {
          addon_version_id: number
          billing_provider_subscription_item_id: string | null
          created_at: string
          ends_at: string | null
          id: number
          quantity: number
          started_at: string
          status: string
          subscription_id: number
          updated_at: string
        }
        Insert: {
          addon_version_id: number
          billing_provider_subscription_item_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: never
          quantity?: number
          started_at?: string
          status?: string
          subscription_id: number
          updated_at?: string
        }
        Update: {
          addon_version_id?: number
          billing_provider_subscription_item_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: never
          quantity?: number
          started_at?: string
          status?: string
          subscription_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_addons_addon_version_id_fkey"
            columns: ["addon_version_id"]
            isOneToOne: false
            referencedRelation: "addon_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_addons_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_change_requests: {
        Row: {
          billing_impact: Json
          billing_provider_payload: Json
          created_at: string
          current_plan_version_id: number | null
          effective_at: string | null
          expires_at: string
          failure_reason: string | null
          id: number
          idempotency_key: string | null
          metadata: Json
          organization_id: number
          payment_behavior: Database["public"]["Enums"]["payment_behavior"]
          processed_at: string | null
          proration_behavior: Database["public"]["Enums"]["proration_behavior"]
          requested_by_account_id: number
          status: Database["public"]["Enums"]["change_request_status"]
          subscription_id: number | null
          target_plan_version_id: number | null
          type: Database["public"]["Enums"]["change_request_type"]
        }
        Insert: {
          billing_impact?: Json
          billing_provider_payload?: Json
          created_at?: string
          current_plan_version_id?: number | null
          effective_at?: string | null
          expires_at?: string
          failure_reason?: string | null
          id?: never
          idempotency_key?: string | null
          metadata?: Json
          organization_id: number
          payment_behavior?: Database["public"]["Enums"]["payment_behavior"]
          processed_at?: string | null
          proration_behavior?: Database["public"]["Enums"]["proration_behavior"]
          requested_by_account_id: number
          status?: Database["public"]["Enums"]["change_request_status"]
          subscription_id?: number | null
          target_plan_version_id?: number | null
          type: Database["public"]["Enums"]["change_request_type"]
        }
        Update: {
          billing_impact?: Json
          billing_provider_payload?: Json
          created_at?: string
          current_plan_version_id?: number | null
          effective_at?: string | null
          expires_at?: string
          failure_reason?: string | null
          id?: never
          idempotency_key?: string | null
          metadata?: Json
          organization_id?: number
          payment_behavior?: Database["public"]["Enums"]["payment_behavior"]
          processed_at?: string | null
          proration_behavior?: Database["public"]["Enums"]["proration_behavior"]
          requested_by_account_id?: number
          status?: Database["public"]["Enums"]["change_request_status"]
          subscription_id?: number | null
          target_plan_version_id?: number | null
          type?: Database["public"]["Enums"]["change_request_type"]
        }
        Relationships: [
          {
            foreignKeyName: "subscription_change_requests_current_plan_version_id_fkey"
            columns: ["current_plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_change_requests_requested_by_account_id_fkey"
            columns: ["requested_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_change_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_change_requests_target_plan_version_id_fkey"
            columns: ["target_plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_contracts: {
        Row: {
          created_at: string
          custom_pricing: Json
          document_url: string | null
          end_date: string | null
          id: number
          negotiated_features: Json
          organization_id: number
          signed_at: string | null
          signed_by_account_id: number | null
          sla_tier: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          subscription_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_pricing?: Json
          document_url?: string | null
          end_date?: string | null
          id?: never
          negotiated_features?: Json
          organization_id: number
          signed_at?: string | null
          signed_by_account_id?: number | null
          sla_tier?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          subscription_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_pricing?: Json
          document_url?: string | null
          end_date?: string | null
          id?: never
          negotiated_features?: Json
          organization_id?: number
          signed_at?: string | null
          signed_by_account_id?: number | null
          sla_tier?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          subscription_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_contracts_signed_by_account_id_fkey"
            columns: ["signed_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_contracts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_entitlements: {
        Row: {
          computed_at: string
          created_at: string
          feature_id: number
          feature_key: string
          id: number
          is_unlimited: boolean
          organization_id: number
          source: Database["public"]["Enums"]["entitlement_source"]
          subscription_id: number
          valid_until: string | null
          value_boolean: boolean | null
          value_limit: number | null
        }
        Insert: {
          computed_at?: string
          created_at?: string
          feature_id: number
          feature_key: string
          id?: never
          is_unlimited?: boolean
          organization_id: number
          source?: Database["public"]["Enums"]["entitlement_source"]
          subscription_id: number
          valid_until?: string | null
          value_boolean?: boolean | null
          value_limit?: number | null
        }
        Update: {
          computed_at?: string
          created_at?: string
          feature_id?: number
          feature_key?: string
          id?: never
          is_unlimited?: boolean
          organization_id?: number
          source?: Database["public"]["Enums"]["entitlement_source"]
          subscription_id?: number
          valid_until?: string | null
          value_boolean?: boolean | null
          value_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_entitlements_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_entitlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_entitlements_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          id: number
          occurred_at: string
          organization_id: number
          payload: Json
          subscription_id: number | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: never
          occurred_at?: string
          organization_id: number
          payload?: Json
          subscription_id?: number | null
          type: string
        }
        Update: {
          created_at?: string
          id?: never
          occurred_at?: string
          organization_id?: number
          payload?: Json
          subscription_id?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_anchor_day: number | null
          billing_provider:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_subscription_id: string | null
          cancel_at: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: number
          metadata: Json
          organization_id: number
          plan_version_id: number
          quantity: number
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          billing_anchor_day?: number | null
          billing_provider?:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_subscription_id?: string | null
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: never
          metadata?: Json
          organization_id: number
          plan_version_id: number
          quantity?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          billing_anchor_day?: number | null
          billing_provider?:
            | Database["public"]["Enums"]["billing_provider"]
            | null
          billing_provider_subscription_id?: string | null
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: never
          metadata?: Json
          organization_id?: number
          plan_version_id?: number
          quantity?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          created_at: string
          feature_id: number
          feature_key: string
          id: number
          idempotency_key: string | null
          metadata: Json
          organization_id: number
          period_end: string
          period_start: string
          quantity: number
          recorded_at: string
          subscription_id: number
        }
        Insert: {
          created_at?: string
          feature_id: number
          feature_key: string
          id?: never
          idempotency_key?: string | null
          metadata?: Json
          organization_id: number
          period_end: string
          period_start: string
          quantity?: number
          recorded_at?: string
          subscription_id: number
        }
        Update: {
          created_at?: string
          feature_id?: number
          feature_key?: string
          id?: never
          idempotency_key?: string | null
          metadata?: Json
          organization_id?: number
          period_end?: string
          period_start?: string
          quantity?: number
          recorded_at?: string
          subscription_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_summaries: {
        Row: {
          created_at: string
          feature_id: number
          feature_key: string
          id: number
          last_updated_at: string
          organization_id: number
          period_end: string
          period_start: string
          subscription_id: number
          total_quantity: number
        }
        Insert: {
          created_at?: string
          feature_id: number
          feature_key: string
          id?: never
          last_updated_at?: string
          organization_id: number
          period_end: string
          period_start: string
          subscription_id: number
          total_quantity?: number
        }
        Update: {
          created_at?: string
          feature_id?: number
          feature_key?: string
          id?: never
          last_updated_at?: string
          organization_id?: number
          period_end?: string
          period_start?: string
          subscription_id?: number
          total_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_summaries_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_summaries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_summaries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recompute_entitlements: {
        Args: { p_subscription_id: number }
        Returns: undefined
      }
    }
    Enums: {
      billing_interval: "daily" | "weekly" | "monthly" | "yearly"
      billing_provider: "stripe" | "paddle" | "manual"
      billing_reason:
        | "subscription_create"
        | "subscription_cycle"
        | "subscription_update"
        | "subscription_threshold"
        | "manual"
        | "upcoming"
      change_request_status:
        | "pending"
        | "processing"
        | "awaiting_payment"
        | "completed"
        | "failed"
        | "cancelled"
        | "expired"
      change_request_type:
        | "create"
        | "upgrade"
        | "downgrade"
        | "cancel"
        | "pause"
        | "resume"
        | "renew"
        | "add_seats"
        | "remove_seats"
        | "add_addon"
        | "remove_addon"
      contract_status: "draft" | "active" | "expired" | "terminated"
      credit_note_reason:
        | "duplicate"
        | "fraudulent"
        | "order_change"
        | "product_unsatisfactory"
      credit_note_status: "draft" | "issued" | "void"
      entitlement_source: "plan" | "addon" | "override" | "promotion"
      feature_reset_period: "daily" | "weekly" | "monthly" | "yearly" | "never"
      feature_type: "boolean" | "limit" | "metered"
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible"
      invoice_type: "subscription" | "one_time" | "credit_note"
      org_member_role: "owner" | "admin" | "member" | "billing"
      payment_behavior:
        | "default_incomplete"
        | "error_if_incomplete"
        | "allow_incomplete"
      payment_method: "card" | "bank_transfer" | "wallet" | "manual" | "crypto"
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "refunded"
        | "partially_refunded"
      proration_behavior: "create_prorations" | "none" | "always_invoice"
      subscription_status:
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "paused"
        | "cancelled"
        | "expired"
      webhook_event_status: "pending" | "processed" | "failed" | "ignored"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_interval: ["daily", "weekly", "monthly", "yearly"],
      billing_provider: ["stripe", "paddle", "manual"],
      billing_reason: [
        "subscription_create",
        "subscription_cycle",
        "subscription_update",
        "subscription_threshold",
        "manual",
        "upcoming",
      ],
      change_request_status: [
        "pending",
        "processing",
        "awaiting_payment",
        "completed",
        "failed",
        "cancelled",
        "expired",
      ],
      change_request_type: [
        "create",
        "upgrade",
        "downgrade",
        "cancel",
        "pause",
        "resume",
        "renew",
        "add_seats",
        "remove_seats",
        "add_addon",
        "remove_addon",
      ],
      contract_status: ["draft", "active", "expired", "terminated"],
      credit_note_reason: [
        "duplicate",
        "fraudulent",
        "order_change",
        "product_unsatisfactory",
      ],
      credit_note_status: ["draft", "issued", "void"],
      entitlement_source: ["plan", "addon", "override", "promotion"],
      feature_reset_period: ["daily", "weekly", "monthly", "yearly", "never"],
      feature_type: ["boolean", "limit", "metered"],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      invoice_type: ["subscription", "one_time", "credit_note"],
      org_member_role: ["owner", "admin", "member", "billing"],
      payment_behavior: [
        "default_incomplete",
        "error_if_incomplete",
        "allow_incomplete",
      ],
      payment_method: ["card", "bank_transfer", "wallet", "manual", "crypto"],
      payment_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      proration_behavior: ["create_prorations", "none", "always_invoice"],
      subscription_status: [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "paused",
        "cancelled",
        "expired",
      ],
      webhook_event_status: ["pending", "processed", "failed", "ignored"],
    },
  },
} as const
