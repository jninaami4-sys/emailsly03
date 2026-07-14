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
          tiktok_pixel_id: string
          updated_at: string
        }
        Insert: {
          custom_head_html?: string
          fb_pixel_id?: string
          ga4_id?: string
          gtm_id?: string
          id?: boolean
          tiktok_pixel_id?: string
          updated_at?: string
        }
        Update: {
          custom_head_html?: string
          fb_pixel_id?: string
          ga4_id?: string
          gtm_id?: string
          id?: boolean
          tiktok_pixel_id?: string
          updated_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
