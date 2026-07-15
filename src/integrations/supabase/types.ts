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
      announcements: {
        Row: {
          accent: string
          badge: string
          body: string
          created_at: string
          cta_label: string
          cta_url: string
          enabled: boolean
          id: string
          image_style: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          accent?: string
          badge?: string
          body?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          enabled?: boolean
          id?: string
          image_style?: string
          image_url?: string
          title: string
          updated_at?: string
        }
        Update: {
          accent?: string
          badge?: string
          body?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          enabled?: boolean
          id?: string
          image_style?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_config: {
        Row: {
          enabled: boolean
          greeting: string
          human_hours_note: string
          id: boolean
          telegram_admin_chat_id: string
          ticket_webhook_url: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          greeting?: string
          human_hours_note?: string
          id?: boolean
          telegram_admin_chat_id?: string
          ticket_webhook_url?: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          greeting?: string
          human_hours_note?: string
          id?: boolean
          telegram_admin_chat_id?: string
          ticket_webhook_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_conversations: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_message: string
          order_id: string | null
          session_id: string
          short_code: string
          status: string
          updated_at: string
          visitor_name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_message?: string
          order_id?: string | null
          session_id: string
          short_code?: string
          status?: string
          updated_at?: string
          visitor_name?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_message?: string
          order_id?: string | null
          session_id?: string
          short_code?: string
          status?: string
          updated_at?: string
          visitor_name?: string
        }
        Relationships: []
      }
      chatbot_kb: {
        Row: {
          answer: string
          category: string
          created_at: string
          enabled: boolean
          id: string
          sort_order: number
          source: string
          source_key: string | null
          title: string
          updated_at: string
        }
        Insert: {
          answer?: string
          category?: string
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          source?: string
          source_key?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          source?: string
          source_key?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          sender: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          sender: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chatbot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_orders: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          details: string
          email: string
          id: string
          notes: string
          order_id: string
          quantity: number
          service: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name?: string
          details?: string
          email?: string
          id?: string
          notes?: string
          order_id?: string
          quantity?: number
          service?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          details?: string
          email?: string
          id?: string
          notes?: string
          order_id?: string
          quantity?: number
          service?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_telegram_map: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          telegram_chat_id: number
          telegram_message_id: number
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          telegram_chat_id: number
          telegram_message_id: number
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          telegram_chat_id?: number
          telegram_message_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_telegram_map_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chatbot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          issue: string
          name: string
          status: string
          ticket_no: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          issue?: string
          name?: string
          status?: string
          ticket_no?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          issue?: string
          name?: string
          status?: string
          ticket_no?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          event_key: string
          ga4_event_name: string
          ga4_params: Json
          id: string
          meta_event_name: string
          meta_params: Json
          name: string
          tiktok_event_name: string
          tiktok_params: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          enabled?: boolean
          event_key: string
          ga4_event_name?: string
          ga4_params?: Json
          id?: string
          meta_event_name?: string
          meta_params?: Json
          name?: string
          tiktok_event_name?: string
          tiktok_params?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          event_key?: string
          ga4_event_name?: string
          ga4_params?: Json
          id?: string
          meta_event_name?: string
          meta_params?: Json
          name?: string
          tiktok_event_name?: string
          tiktok_params?: Json
          updated_at?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          actor_id: string | null
          actor_role: string
          created_at: string
          event_type: string
          id: string
          message: string | null
          metadata: Json
          order_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json
          order_id: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          order_id: string
          sender_id: string | null
          sender_role: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          order_id: string
          sender_id?: string | null
          sender_role?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          order_id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          delivered_by: string | null
          delivery_notes: string | null
          delivery_url: string | null
          discount_cents: number
          email: string
          external_id: string | null
          id: string
          imported_from: string | null
          metadata: Json
          payment_provider: string | null
          payment_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          promo_code: string | null
          quantity: number
          service_id: string | null
          service_label: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_notes?: string | null
          delivery_url?: string | null
          discount_cents?: number
          email: string
          external_id?: string | null
          id?: string
          imported_from?: string | null
          metadata?: Json
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          promo_code?: string | null
          quantity?: number
          service_id?: string | null
          service_label: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_notes?: string | null
          delivery_url?: string | null
          discount_cents?: number
          email?: string
          external_id?: string | null
          id?: string
          imported_from?: string | null
          metadata?: Json
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          promo_code?: string | null
          quantity?: number
          service_id?: string | null
          service_label?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          created_at: string
          fixed: boolean
          helper: string | null
          min_order: number
          min_qty: number
          name: string
          rate: number
          service_id: string
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fixed?: boolean
          helper?: string | null
          min_order?: number
          min_qty?: number
          name: string
          rate: number
          service_id: string
          sort_order?: number
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fixed?: boolean
          helper?: string | null
          min_order?: number
          min_qty?: number
          name?: string
          rate?: number
          service_id?: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_details: {
        Row: {
          created_at: string
          cta_label: string
          cta_url: string
          enabled: boolean
          extra_info: string
          id: string
          image_url: string
          long_description: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string
          cta_url?: string
          enabled?: boolean
          extra_info?: string
          id?: string
          image_url?: string
          long_description?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string
          cta_url?: string
          enabled?: boolean
          extra_info?: string
          id?: string
          image_url?: string
          long_description?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          imported_from: string | null
          notes: string | null
          phone: string | null
          referral_code: string | null
          referred_by_user_id: string | null
          signup_ip: unknown
          signup_ua_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          imported_from?: string | null
          notes?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by_user_id?: string | null
          signup_ip?: unknown
          signup_ua_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          imported_from?: string | null
          notes?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by_user_id?: string | null
          signup_ip?: unknown
          signup_ua_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          click_day: string
          code: string
          created_at: string
          id: string
          ip: unknown
          landing_url: string | null
          referer: string | null
          ua_hash: string | null
          visitor_hash: string
        }
        Insert: {
          click_day?: string
          code: string
          created_at?: string
          id?: string
          ip?: unknown
          landing_url?: string | null
          referer?: string | null
          ua_hash?: string | null
          visitor_hash: string
        }
        Update: {
          click_day?: string
          code?: string
          created_at?: string
          id?: string
          ip?: unknown
          landing_url?: string | null
          referer?: string | null
          ua_hash?: string | null
          visitor_hash?: string
        }
        Relationships: []
      }
      referral_credits: {
        Row: {
          created_at: string
          currency: string
          delta_cents: number
          id: string
          notes: string | null
          order_id: string | null
          paid_out_at: string | null
          payout_batch_id: string | null
          referral_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          delta_cents: number
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_out_at?: string | null
          payout_batch_id?: string | null
          referral_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          delta_cents?: number
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_out_at?: string | null
          payout_batch_id?: string | null
          referral_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_payout_batches: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          total_cents: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          total_cents?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          total_cents?: number
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          id: boolean
          min_order_cents: number
          monthly_cap_cents: number
          reward_percent: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          min_order_cents?: number
          monthly_cap_cents?: number
          reward_percent?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          min_order_cents?: number
          monthly_cap_cents?: number
          reward_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          admin_review_state: string
          created_at: string
          currency: string
          flag_reasons: string[]
          id: string
          notes: string | null
          order_id: string | null
          paid_out_at: string | null
          payout_method:
            | Database["public"]["Enums"]["referral_payout_method"]
            | null
          referred_user_id: string
          referrer_id: string
          reward_referred_cents: number
          reward_referrer_cents: number
          signup_ip: unknown
          signup_ua_hash: string | null
          status: Database["public"]["Enums"]["referral_status"]
          updated_at: string
        }
        Insert: {
          admin_review_state?: string
          created_at?: string
          currency?: string
          flag_reasons?: string[]
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_out_at?: string | null
          payout_method?:
            | Database["public"]["Enums"]["referral_payout_method"]
            | null
          referred_user_id: string
          referrer_id: string
          reward_referred_cents?: number
          reward_referrer_cents?: number
          signup_ip?: unknown
          signup_ua_hash?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Update: {
          admin_review_state?: string
          created_at?: string
          currency?: string
          flag_reasons?: string[]
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_out_at?: string | null
          payout_method?:
            | Database["public"]["Enums"]["referral_payout_method"]
            | null
          referred_user_id?: string
          referrer_id?: string
          reward_referred_cents?: number
          reward_referrer_cents?: number
          signup_ip?: unknown
          signup_ua_hash?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved_at: string | null
          body: string | null
          country: string | null
          created_at: string
          display_name: string
          duration_sec: number | null
          id: string
          media_kind: string
          rating: number
          reject_reason: string | null
          role: string | null
          status: string
          updated_at: string
          user_id: string
          video_path: string | null
          video_poster_path: string | null
        }
        Insert: {
          approved_at?: string | null
          body?: string | null
          country?: string | null
          created_at?: string
          display_name: string
          duration_sec?: number | null
          id?: string
          media_kind: string
          rating: number
          reject_reason?: string | null
          role?: string | null
          status?: string
          updated_at?: string
          user_id: string
          video_path?: string | null
          video_poster_path?: string | null
        }
        Update: {
          approved_at?: string | null
          body?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          duration_sec?: number | null
          id?: string
          media_kind?: string
          rating?: number
          reject_reason?: string | null
          role?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          video_path?: string | null
          video_poster_path?: string | null
        }
        Relationships: []
      }
      server_event_log: {
        Row: {
          created_at: string
          error: string | null
          event_id: string
          event_key: string
          id: string
          ip: unknown
          providers: Json
          status: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id: string
          event_key: string
          id?: string
          ip?: unknown
          providers?: Json
          status?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string
          event_key?: string
          id?: string
          ip?: unknown
          providers?: Json
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      server_tracking_config: {
        Row: {
          created_at: string
          ga4_api_secret: string
          ga4_enabled: boolean
          ga4_measurement_id: string
          id: string
          meta_access_token: string
          meta_enabled: boolean
          meta_pixel_id: string
          meta_test_event_code: string
          singleton: boolean
          tiktok_access_token: string
          tiktok_enabled: boolean
          tiktok_pixel_id: string
          tiktok_test_event_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ga4_api_secret?: string
          ga4_enabled?: boolean
          ga4_measurement_id?: string
          id?: string
          meta_access_token?: string
          meta_enabled?: boolean
          meta_pixel_id?: string
          meta_test_event_code?: string
          singleton?: boolean
          tiktok_access_token?: string
          tiktok_enabled?: boolean
          tiktok_pixel_id?: string
          tiktok_test_event_code?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ga4_api_secret?: string
          ga4_enabled?: boolean
          ga4_measurement_id?: string
          id?: string
          meta_access_token?: string
          meta_enabled?: boolean
          meta_pixel_id?: string
          meta_test_event_code?: string
          singleton?: boolean
          tiktok_access_token?: string
          tiktok_enabled?: boolean
          tiktok_pixel_id?: string
          tiktok_test_event_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          custom_head_html: string
          fb_pixel_id: string
          ga4_id: string
          gtm_id: string
          id: boolean
          tawk_enabled: boolean
          tawk_position: string
          tiktok_pixel_id: string
          updated_at: string
        }
        Insert: {
          custom_head_html?: string
          fb_pixel_id?: string
          ga4_id?: string
          gtm_id?: string
          id?: boolean
          tawk_enabled?: boolean
          tawk_position?: string
          tiktok_pixel_id?: string
          updated_at?: string
        }
        Update: {
          custom_head_html?: string
          fb_pixel_id?: string
          ga4_id?: string
          gtm_id?: string
          id?: boolean
          tawk_enabled?: boolean
          tawk_position?: string
          tiktok_pixel_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          id: string
          payload: Json | null
          received_at: string
          type: string
        }
        Insert: {
          id: string
          payload?: Json | null
          received_at?: string
          type: string
        }
        Update: {
          id?: string
          payload?: Json | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      get_referral_balance: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_referral_credit: {
        Args: {
          _order_id: string
          _requested_cents: number
          _subtotal_cents: number
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      order_status:
        | "pending"
        | "in_progress"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "revision_requested"
      payment_status: "unpaid" | "paid" | "refunded" | "failed" | "pending"
      referral_payout_method: "credit" | "cash"
      referral_status:
        | "pending"
        | "qualified"
        | "rewarded"
        | "paid_out"
        | "cancelled"
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
      app_role: ["admin", "moderator", "user"],
      order_status: [
        "pending",
        "in_progress",
        "delivered",
        "cancelled",
        "refunded",
        "revision_requested",
      ],
      payment_status: ["unpaid", "paid", "refunded", "failed", "pending"],
      referral_payout_method: ["credit", "cash"],
      referral_status: [
        "pending",
        "qualified",
        "rewarded",
        "paid_out",
        "cancelled",
      ],
    },
  },
} as const
