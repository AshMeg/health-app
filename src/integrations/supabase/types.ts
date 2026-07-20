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
      body_measurements: {
        Row: {
          chest_cm: number | null
          created_at: string
          date: string
          hips_cm: number | null
          id: string
          left_arm_cm: number | null
          left_calf_cm: number | null
          left_thigh_cm: number | null
          neck_cm: number | null
          notes: string | null
          right_arm_cm: number | null
          right_calf_cm: number | null
          right_thigh_cm: number | null
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          chest_cm?: number | null
          created_at?: string
          date?: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_calf_cm?: number | null
          left_thigh_cm?: number | null
          neck_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_calf_cm?: number | null
          right_thigh_cm?: number | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          chest_cm?: number | null
          created_at?: string
          date?: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_calf_cm?: number | null
          left_thigh_cm?: number | null
          neck_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_calf_cm?: number | null
          right_thigh_cm?: number | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          avatar_url: string | null
          biological_sex: Database["public"]["Enums"]["biological_sex"] | null
          calorie_target: number | null
          carb_target: number | null
          created_at: string
          date_of_birth: string | null
          fat_target: number | null
          full_name: string | null
          height_cm: number | null
          id: string
          protein_target: number | null
          updated_at: string
          weight_goal: Database["public"]["Enums"]["weight_goal"] | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          avatar_url?: string | null
          biological_sex?: Database["public"]["Enums"]["biological_sex"] | null
          calorie_target?: number | null
          carb_target?: number | null
          created_at?: string
          date_of_birth?: string | null
          fat_target?: number | null
          full_name?: string | null
          height_cm?: number | null
          id: string
          protein_target?: number | null
          updated_at?: string
          weight_goal?: Database["public"]["Enums"]["weight_goal"] | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          avatar_url?: string | null
          biological_sex?: Database["public"]["Enums"]["biological_sex"] | null
          calorie_target?: number | null
          carb_target?: number | null
          created_at?: string
          date_of_birth?: string | null
          fat_target?: number | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          protein_target?: number | null
          updated_at?: string
          weight_goal?: Database["public"]["Enums"]["weight_goal"] | null
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
      weight_logs: {
        Row: {
          body_fat_percent: number | null
          created_at: string
          date: string
          id: string
          notes: string | null
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          body_fat_percent?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          body_fat_percent?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
          weight_kg?: number
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
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active"
      app_role: "admin" | "user"
      biological_sex: "male" | "female" | "other" | "prefer_not_to_say"
      data_source:
        | "manual"
        | "apple_health"
        | "health_connect"
        | "garmin"
        | "strava"
        | "oura"
        | "whoop"
        | "myfitnesspal"
      weight_goal: "lose" | "maintain" | "gain"
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
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ],
      app_role: ["admin", "user"],
      biological_sex: ["male", "female", "other", "prefer_not_to_say"],
      data_source: [
        "manual",
        "apple_health",
        "health_connect",
        "garmin",
        "strava",
        "oura",
        "whoop",
        "myfitnesspal",
      ],
      weight_goal: ["lose", "maintain", "gain"],
    },
  },
} as const
