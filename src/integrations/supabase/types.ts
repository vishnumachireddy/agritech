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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bulk_orders: {
        Row: {
          consumer_id: string
          created_at: string
          crop_name: string
          delivery_date: string | null
          id: string
          preferred_region: string | null
          quantity_requested: number
          status: string
        }
        Insert: {
          consumer_id: string
          created_at?: string
          crop_name: string
          delivery_date?: string | null
          id?: string
          preferred_region?: string | null
          quantity_requested?: number
          status?: string
        }
        Update: {
          consumer_id?: string
          created_at?: string
          crop_name?: string
          delivery_date?: string | null
          id?: string
          preferred_region?: string | null
          quantity_requested?: number
          status?: string
        }
        Relationships: []
      }
      bulk_quotes: {
        Row: {
          available_quantity: number
          bulk_order_id: string
          created_at: string
          farmer_id: string
          id: string
          quoted_price: number
          status: string
        }
        Insert: {
          available_quantity?: number
          bulk_order_id: string
          created_at?: string
          farmer_id: string
          id?: string
          quoted_price?: number
          status?: string
        }
        Update: {
          available_quantity?: number
          bulk_order_id?: string
          created_at?: string
          farmer_id?: string
          id?: string
          quoted_price?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_quotes_bulk_order_id_fkey"
            columns: ["bulk_order_id"]
            isOneToOne: false
            referencedRelation: "bulk_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_requests: {
        Row: {
          consumer_id: string
          created_at: string
          crop_id: string
          farmer_id: string
          id: string
          quantity: number
          status: string
        }
        Insert: {
          consumer_id: string
          created_at?: string
          crop_id: string
          farmer_id: string
          id?: string
          quantity?: number
          status?: string
        }
        Update: {
          consumer_id?: string
          created_at?: string
          crop_id?: string
          farmer_id?: string
          id?: string
          quantity?: number
          status?: string
        }
        Relationships: []
      }
      crop_traceability: {
        Row: {
          certification_type: string | null
          created_at: string
          crop_name: string
          farm_location: string | null
          farmer_id: string
          fertilizer_used: string | null
          harvest_date: string | null
          id: string
          order_id: string
          packaging_date: string | null
          pesticide_used: string | null
          soil_type: string | null
          sowing_date: string | null
        }
        Insert: {
          certification_type?: string | null
          created_at?: string
          crop_name: string
          farm_location?: string | null
          farmer_id: string
          fertilizer_used?: string | null
          harvest_date?: string | null
          id?: string
          order_id: string
          packaging_date?: string | null
          pesticide_used?: string | null
          soil_type?: string | null
          sowing_date?: string | null
        }
        Update: {
          certification_type?: string | null
          created_at?: string
          crop_name?: string
          farm_location?: string | null
          farmer_id?: string
          fertilizer_used?: string | null
          harvest_date?: string | null
          id?: string
          order_id?: string
          packaging_date?: string | null
          pesticide_used?: string | null
          soil_type?: string | null
          sowing_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_traceability_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          avg_yield: number | null
          created_at: string
          disease_risk_index: number | null
          fertilizer_cost: number | null
          id: string
          name: string
          water_requirement: number | null
        }
        Insert: {
          avg_yield?: number | null
          created_at?: string
          disease_risk_index?: number | null
          fertilizer_cost?: number | null
          id?: string
          name: string
          water_requirement?: number | null
        }
        Update: {
          avg_yield?: number | null
          created_at?: string
          disease_risk_index?: number | null
          fertilizer_cost?: number | null
          id?: string
          name?: string
          water_requirement?: number | null
        }
        Relationships: []
      }
      delivery_tracking: {
        Row: {
          current_latitude: number
          current_longitude: number
          estimated_arrival_time: string | null
          id: string
          last_updated: string
          order_id: string
          speed: number | null
        }
        Insert: {
          current_latitude?: number
          current_longitude?: number
          estimated_arrival_time?: string | null
          id?: string
          last_updated?: string
          order_id: string
          speed?: number | null
        }
        Update: {
          current_latitude?: number
          current_longitude?: number
          estimated_arrival_time?: string | null
          id?: string
          last_updated?: string
          order_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_details: {
        Row: {
          created_at: string
          expected_price: number
          farming_type: string
          harvest_cycle: string
          id: string
          land_area: number
          latitude: number | null
          longitude: number | null
          monthly_production: number
          primary_crop: string
          secondary_crop: string | null
          total_yield: number
          user_id: string
          water_availability: string
        }
        Insert: {
          created_at?: string
          expected_price?: number
          farming_type?: string
          harvest_cycle?: string
          id?: string
          land_area?: number
          latitude?: number | null
          longitude?: number | null
          monthly_production?: number
          primary_crop?: string
          secondary_crop?: string | null
          total_yield?: number
          user_id: string
          water_availability?: string
        }
        Update: {
          created_at?: string
          expected_price?: number
          farming_type?: string
          harvest_cycle?: string
          id?: string
          land_area?: number
          latitude?: number | null
          longitude?: number | null
          monthly_production?: number
          primary_crop?: string
          secondary_crop?: string | null
          total_yield?: number
          user_id?: string
          water_availability?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmer_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          budget: number | null
          created_at: string
          id: string
          risk_tolerance: number | null
          soil_type: string | null
          user_id: string
          water_capacity: number | null
        }
        Insert: {
          budget?: number | null
          created_at?: string
          id?: string
          risk_tolerance?: number | null
          soil_type?: string | null
          user_id: string
          water_capacity?: number | null
        }
        Update: {
          budget?: number | null
          created_at?: string
          id?: string
          risk_tolerance?: number | null
          soil_type?: string | null
          user_id?: string
          water_capacity?: number | null
        }
        Relationships: []
      }
      government_schemes: {
        Row: {
          benefits: string[]
          category: string
          created_at: string
          description: string
          icon_name: string
          id: string
          official_url: string
          title: string
        }
        Insert: {
          benefits?: string[]
          category: string
          created_at?: string
          description: string
          icon_name?: string
          id?: string
          official_url?: string
          title: string
        }
        Update: {
          benefits?: string[]
          category?: string
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          official_url?: string
          title?: string
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          crop_id: string | null
          id: string
          price: number | null
          region: string | null
          updated_at: string
        }
        Insert: {
          crop_id?: string | null
          id?: string
          price?: number | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          crop_id?: string | null
          id?: string
          price?: number | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_prices_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          consumer_id: string
          created_at: string
          crop_id: string
          crop_name: string
          farmer_id: string
          id: string
          price_per_kg: number
          quantity: number
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          consumer_id: string
          created_at?: string
          crop_id: string
          crop_name?: string
          farmer_id: string
          id?: string
          price_per_kg?: number
          quantity?: number
          status?: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          consumer_id?: string
          created_at?: string
          crop_id?: string
          crop_name?: string
          farmer_id?: string
          id?: string
          price_per_kg?: number
          quantity?: number
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          delivery_address: string | null
          email: string
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          phone: string
          region: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          email?: string
          full_name?: string
          id: string
          latitude?: number | null
          longitude?: number | null
          phone?: string
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          email?: string
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          humidity: number | null
          id: string
          rainfall: number | null
          region: string | null
          temperature: number | null
          timestamp: string
        }
        Insert: {
          humidity?: number | null
          id?: string
          rainfall?: number | null
          region?: string | null
          temperature?: number | null
          timestamp?: string
        }
        Update: {
          humidity?: number | null
          id?: string
          rainfall?: number | null
          region?: string | null
          temperature?: number | null
          timestamp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_farmers: { Args: never; Returns: number }
      get_public_farmer_profiles: {
        Args: never
        Returns: {
          full_name: string
          id: string
          region: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "farmer" | "consumer"
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
      app_role: ["farmer", "consumer"],
    },
  },
} as const
