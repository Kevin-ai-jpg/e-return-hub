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
      campaigns: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          region: string | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id?: string
          region?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          region?: string | null
          title?: string | null
        }
        Relationships: []
      }
      collection_points: {
        Row: {
          address: string | null
          collector_id: string | null
          contact: string | null
          deee_types: string[] | null
          id: string
          lat: number | null
          lng: number | null
          name: string | null
          schedule: string | null
        }
        Insert: {
          address?: string | null
          collector_id?: string | null
          contact?: string | null
          deee_types?: string[] | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string | null
          schedule?: string | null
        }
        Update: {
          address?: string | null
          collector_id?: string | null
          contact?: string | null
          deee_types?: string[] | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string | null
          schedule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_points_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          confirmed_at: string | null
          id: string
          kg_collected: number | null
          pickup_request_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          id?: string
          kg_collected?: number | null
          pickup_request_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          id?: string
          kg_collected?: number | null
          pickup_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_offers: {
        Row: {
          accepts_home_pickup: boolean | null
          collector_id: string | null
          deee_type: string | null
          earliest_pickup_days: number | null
          id: string
          voucher_value_lei: number
        }
        Insert: {
          accepts_home_pickup?: boolean | null
          collector_id?: string | null
          deee_type?: string | null
          earliest_pickup_days?: number | null
          id?: string
          voucher_value_lei: number
        }
        Update: {
          accepts_home_pickup?: boolean | null
          collector_id?: string | null
          deee_type?: string | null
          earliest_pickup_days?: number | null
          id?: string
          voucher_value_lei?: number
        }
        Relationships: [
          {
            foreignKeyName: "collector_offers_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
        ]
      }
      collectors: {
        Row: {
          company_name: string
          county: string | null
          description: string | null
          id: string
          logo_url: string | null
          pickup_methods: string | null
          rating: number | null
          service_area_counties: string[] | null
          user_id: string | null
        }
        Insert: {
          company_name: string
          county?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          pickup_methods?: string | null
          rating?: number | null
          service_area_counties?: string[] | null
          user_id?: string | null
        }
        Update: {
          company_name?: string
          county?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          pickup_methods?: string | null
          rating?: number | null
          service_area_counties?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collectors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          address: string | null
          collector_id: string | null
          created_at: string | null
          deee_type: string | null
          id: string
          lat: number | null
          lng: number | null
          offer_id: string | null
          scheduled_date: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          collector_id?: string | null
          created_at?: string | null
          deee_type?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          offer_id?: string | null
          scheduled_date?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          collector_id?: string | null
          created_at?: string | null
          deee_type?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          offer_id?: string | null
          scheduled_date?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "collector_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      retailers: {
        Row: {
          active: boolean | null
          discount_percent: number | null
          id: string
          logo_url: string | null
          name: string
          website_url: string | null
        }
        Insert: {
          active?: boolean | null
          discount_percent?: number | null
          id?: string
          logo_url?: string | null
          name: string
          website_url?: string | null
        }
        Update: {
          active?: boolean | null
          discount_percent?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          email_campaigns: boolean | null
          id: string
          name: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          email_campaigns?: boolean | null
          id: string
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          email_campaigns?: boolean | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          code: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          redeemed_at: string | null
          retailer_id: string | null
          status: string | null
          user_id: string | null
          value_lei: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          retailer_id?: string | null
          status?: string | null
          user_id?: string | null
          value_lei?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          retailer_id?: string | null
          status?: string | null
          user_id?: string | null
          value_lei?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      collections_by_county: {
        Row: {
          collector_id: string | null
          collector_name: string | null
          confirmed_at: string | null
          county: string | null
          deee_type: string | null
          id: string | null
          kg_collected: number | null
          pickup_request_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
