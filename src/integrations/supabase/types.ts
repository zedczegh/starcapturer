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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string
          metadata: Json | null
          notification_type: string
          related_application_id: string | null
          related_spot_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message: string
          metadata?: Json | null
          notification_type: string
          related_application_id?: string | null
          related_spot_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          related_application_id?: string | null
          related_spot_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      astro_spot_advantages: {
        Row: {
          advantage_name: string
          id: string
          spot_id: string
        }
        Insert: {
          advantage_name: string
          id?: string
          spot_id: string
        }
        Update: {
          advantage_name?: string
          id?: string
          spot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_spot_advantages_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "user_astro_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      astro_spot_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          image_urls: string[] | null
          parent_id: string | null
          spot_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          parent_id?: string | null
          spot_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          parent_id?: string | null
          spot_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_spot_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "astro_spot_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "astro_spot_comments_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "user_astro_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      astro_spot_reservations: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          host_notes: string | null
          id: string
          status: string
          timeslot_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          host_notes?: string | null
          id?: string
          status?: string
          timeslot_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          host_notes?: string | null
          id?: string
          status?: string
          timeslot_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_spot_reservations_timeslot_id_fkey"
            columns: ["timeslot_id"]
            isOneToOne: false
            referencedRelation: "astro_spot_timeslots"
            referencedColumns: ["id"]
          },
        ]
      }
      astro_spot_timeslots: {
        Row: {
          created_at: string
          creator_id: string
          currency: string | null
          description: string | null
          end_time: string
          id: string
          is_free: boolean
          max_capacity: number
          pets_policy: string | null
          price: number | null
          spot_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          currency?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_free?: boolean
          max_capacity?: number
          pets_policy?: string | null
          price?: number | null
          spot_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          currency?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_free?: boolean
          max_capacity?: number
          pets_policy?: string | null
          price?: number | null
          spot_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_spot_timeslots_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "user_astro_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      astro_spot_types: {
        Row: {
          id: string
          spot_id: string
          type_name: string
        }
        Insert: {
          id?: string
          spot_id: string
          type_name: string
        }
        Update: {
          id?: string
          spot_id?: string
          type_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_spot_types_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "user_astro_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      astro_spot_verification_applications: {
        Row: {
          accommodation_description: string | null
          additional_notes: string | null
          admin_notes: string | null
          applicant_id: string
          bortle_level: number | null
          bortle_measurement_url: string | null
          created_at: string
          facility_images_urls: string[] | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          spot_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accommodation_description?: string | null
          additional_notes?: string | null
          admin_notes?: string | null
          applicant_id: string
          bortle_level?: number | null
          bortle_measurement_url?: string | null
          created_at?: string
          facility_images_urls?: string[] | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          spot_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accommodation_description?: string | null
          additional_notes?: string | null
          admin_notes?: string | null
          applicant_id?: string
          bortle_level?: number | null
          bortle_measurement_url?: string | null
          created_at?: string
          facility_images_urls?: string[] | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          spot_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_spot_verification_applications_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "user_astro_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_uploads: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_tags: {
        Row: {
          created_at: string | null
          id: string
          tag: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          preferred_currency: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          id: string
          preferred_currency?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          preferred_currency?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_astro_spots: {
        Row: {
          bortlescale: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          siqs: number | null
          spot_id: string
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          bortlescale?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          siqs?: number | null
          spot_id: string
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          bortlescale?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          siqs?: number | null
          spot_id?: string
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      saved_locations: {
        Row: {
          bortlescale: number | null
          certification: string | null
          created_at: string
          id: string
          isdarkskyreserve: boolean | null
          latitude: number
          longitude: number
          name: string
          siqs: number | null
          timestamp: string
          user_id: string
        }
        Insert: {
          bortlescale?: number | null
          certification?: string | null
          created_at?: string
          id?: string
          isdarkskyreserve?: boolean | null
          latitude: number
          longitude: number
          name: string
          siqs?: number | null
          timestamp?: string
          user_id: string
        }
        Update: {
          bortlescale?: number | null
          certification?: string | null
          created_at?: string
          id?: string
          isdarkskyreserve?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          siqs?: number | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      siqs_calculation_entries: {
        Row: {
          additional_metadata: Json | null
          astro_night_cloud_cover: number | null
          calculated_at: string | null
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          siqs_score: number | null
          user_id: string | null
        }
        Insert: {
          additional_metadata?: Json | null
          astro_night_cloud_cover?: number | null
          calculated_at?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          siqs_score?: number | null
          user_id?: string | null
        }
        Update: {
          additional_metadata?: Json | null
          astro_night_cloud_cover?: number | null
          calculated_at?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          siqs_score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_astro_spots: {
        Row: {
          bortlescale: number | null
          camera_stream_url: string | null
          created_at: string
          default_price: number | null
          description: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          siqs: number | null
          spot_type: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          bortlescale?: number | null
          camera_stream_url?: string | null
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          siqs?: number | null
          spot_type?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          bortlescale?: number | null
          camera_stream_url?: string | null
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          siqs?: number | null
          spot_type?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean | null
          last_four: string | null
          payment_type: string
          stripe_payment_method_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          payment_type: string
          stripe_payment_method_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          payment_type?: string
          stripe_payment_method_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          related_booking_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          related_booking_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          related_booking_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_conversation: {
        Args: { current_user_id: string; partner_id: string }
        Returns: undefined
      }
      get_or_create_wallet: {
        Args: { p_currency?: string; p_user_id: string }
        Returns: string
      }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          id: string
          username: string
        }[]
      }
      get_public_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_url: string
          id: string
          username: string
        }[]
      }
      get_spot_type_color: { Args: { type_name: string }; Returns: string }
      has_role: { Args: { required_role: string }; Returns: boolean }
      insert_astro_spot_reservation: {
        Args: { p_status?: string; p_timeslot_id: string; p_user_id: string }
        Returns: string
      }
      insert_astro_spot_timeslot:
        | {
            Args: {
              p_creator_id: string
              p_currency?: string
              p_description?: string
              p_end_time: string
              p_max_capacity?: number
              p_price?: number
              p_spot_id: string
              p_start_time: string
            }
            Returns: string
          }
        | {
            Args: {
              p_creator_id: string
              p_currency?: string
              p_description?: string
              p_end_time: string
              p_max_capacity?: number
              p_pets_policy?: string
              p_price?: number
              p_spot_id: string
              p_start_time: string
            }
            Returns: string
          }
      is_username_available: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      ping_db: { Args: never; Returns: boolean }
      update_astro_spot_timeslot:
        | {
            Args: {
              p_creator_id: string
              p_currency?: string
              p_description?: string
              p_end_time: string
              p_id: string
              p_max_capacity?: number
              p_price?: number
              p_spot_id: string
              p_start_time: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_creator_id: string
              p_currency?: string
              p_description?: string
              p_end_time: string
              p_id: string
              p_max_capacity?: number
              p_pets_policy?: string
              p_price?: number
              p_spot_id: string
              p_start_time: string
            }
            Returns: boolean
          }
      update_wallet_balance: {
        Args: {
          p_amount: number
          p_currency?: string
          p_description?: string
          p_related_booking_id?: string
          p_stripe_payment_intent_id?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: string
      }
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
