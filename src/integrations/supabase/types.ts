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
      agent_configs: {
        Row: {
          agent_type: string
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_configs_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "agent_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          diamonds_cost: number | null
          id: string
          model_used: string | null
          project_id: string | null
          project_name: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          diamonds_cost?: number | null
          id?: string
          model_used?: string | null
          project_id?: string | null
          project_name?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          diamonds_cost?: number | null
          id?: string
          model_used?: string | null
          project_id?: string | null
          project_name?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      leads_enterprise: {
        Row: {
          additional_users: number | null
          company_name: string
          contact_email: string
          contact_name: string | null
          created_at: string
          id: string
          monthly_cost: number | null
          notes: string | null
          phone: string | null
          selected_modules: string[]
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_users?: number | null
          company_name: string
          contact_email: string
          contact_name?: string | null
          created_at?: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          phone?: string | null
          selected_modules?: string[]
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_users?: number | null
          company_name?: string
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          phone?: string | null
          selected_modules?: string[]
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          diamonds_balance: number
          display_name: string | null
          email: string | null
          id: string
          last_reset_date: string | null
          music_preference: string | null
          plan_type: string
          stripe_secret_key_encrypted: string | null
          updated_at: string | null
          user_id: string
          wallpaper_opacity: number | null
          wallpaper_url: string | null
        }
        Insert: {
          created_at?: string | null
          diamonds_balance?: number
          display_name?: string | null
          email?: string | null
          id?: string
          last_reset_date?: string | null
          music_preference?: string | null
          plan_type?: string
          stripe_secret_key_encrypted?: string | null
          updated_at?: string | null
          user_id: string
          wallpaper_opacity?: number | null
          wallpaper_url?: string | null
        }
        Update: {
          created_at?: string | null
          diamonds_balance?: number
          display_name?: string | null
          email?: string | null
          id?: string
          last_reset_date?: string | null
          music_preference?: string | null
          plan_type?: string
          stripe_secret_key_encrypted?: string | null
          updated_at?: string | null
          user_id?: string
          wallpaper_opacity?: number | null
          wallpaper_url?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          agent_id: string | null
          capital: string | null
          connectivity: string | null
          created_at: string
          deadline: string | null
          deadline_preset: string | null
          id: string
          market: string | null
          name: string
          objective: string | null
          priority: string | null
          resources: string | null
          risk: string | null
          scalability: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          capital?: string | null
          connectivity?: string | null
          created_at?: string
          deadline?: string | null
          deadline_preset?: string | null
          id?: string
          market?: string | null
          name?: string
          objective?: string | null
          priority?: string | null
          resources?: string | null
          risk?: string | null
          scalability?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          capital?: string | null
          connectivity?: string | null
          created_at?: string
          deadline?: string | null
          deadline_preset?: string | null
          id?: string
          market?: string | null
          name?: string
          objective?: string | null
          priority?: string | null
          resources?: string | null
          risk?: string | null
          scalability?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tool_executions: {
        Row: {
          created_at: string
          error: string | null
          id: string
          input: Json | null
          output: Json | null
          status: string
          tool_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          status?: string
          tool_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          status?: string
          tool_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          name: string
          parent_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          parent_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token_encrypted: string | null
          connected_at: string | null
          created_at: string | null
          id: string
          is_connected: boolean | null
          provider: string
          refresh_token_encrypted: string | null
          scopes: string[] | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          provider: string
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          provider?: string
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_planes: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          plan: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_productivity: {
        Row: {
          completed_at: string | null
          created_at: string
          elapsed_seconds: number
          id: string
          orbit_duration: number
          reentry_duration: number
          session_type: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          elapsed_seconds?: number
          id?: string
          orbit_duration?: number
          reentry_duration?: number
          session_type?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          elapsed_seconds?: number
          id?: string
          orbit_duration?: number
          reentry_duration?: number
          session_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
