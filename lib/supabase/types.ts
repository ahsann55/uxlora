export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: "free" | "starter" | "pro" | "studio";
          subscription_status: "active" | "inactive" | "cancelled" | "past_due" | "paused";
          lemon_squeezy_customer_id: string | null;
          lemon_squeezy_subscription_id: string | null;
          generations_used_this_month: number;
          generations_limit: number;
          is_founding_member: boolean;
          is_admin: boolean;
          design_system_prompt: string | null;
          notification_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "free" | "starter" | "pro" | "studio";
          subscription_status?: "active" | "inactive" | "cancelled" | "past_due" | "paused";
          lemon_squeezy_customer_id?: string | null;
          lemon_squeezy_subscription_id?: string | null;
          generations_used_this_month?: number;
          generations_limit?: number;
          is_founding_member?: boolean;
          is_admin?: boolean;
          notification_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "free" | "starter" | "pro" | "studio";
          subscription_status?: "active" | "inactive" | "cancelled" | "past_due" | "paused";
          lemon_squeezy_customer_id?: string | null;
          lemon_squeezy_subscription_id?: string | null;
          generations_used_this_month?: number;
          generations_limit?: number;
          is_founding_member?: boolean;
          is_admin?: boolean;
          notification_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      kits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: "game" | "mobile" | "web";
          input_method: "upload" | "guided";
          checklist_data: Json;
          design_system: Json | null;
          status: "collecting_input" | "queued" | "generating" | "complete" | "failed" | "cancelled";
          current_step: string | null;
          current_screen_index: number;
          total_screens: number;
          error_message: string | null;
          is_demo: boolean;
          design_system_prompt: string | null;
          notification_sent: boolean;
          created_at: string;
          updated_at: string;
          suggestion_tokens: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          category: "game" | "mobile" | "web";
          input_method: "upload" | "guided";
          checklist_data?: Json;
          design_system?: Json | null;
          status?: "collecting_input" | "queued" | "generating" | "complete" | "failed" | "cancelled";
          current_step?: string | null;
          current_screen_index?: number;
          total_screens?: number;
          error_message?: string | null;
          is_demo?: boolean;
          suggestion_tokens?: Json | null;
          notification_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: "game" | "mobile" | "web";
          input_method?: "upload" | "guided";
          checklist_data?: Json;
          design_system?: Json | null;
          status?: "collecting_input" | "queued" | "generating" | "complete" | "failed" | "cancelled";
          current_step?: string | null;
          current_screen_index?: number;
          total_screens?: number;
          error_message?: string | null;
          is_demo?: boolean;
          suggestion_tokens?: Json | null;
          notification_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
     screens: {
        Row: {
          id: string;
          kit_id: string;
          name: string;
          order_index: number;
          html_css: string | null;
          png_url: string | null;
          uxml_url: string | null;
          figma_url: string | null;
          system_prompt: string | null;
          user_prompt: string | null;
          revision_count: number;
          revision_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kit_id: string;
          name: string;
          order_index?: number;
          html_css?: string | null;
          png_url?: string | null;
          uxml_url?: string | null;
          figma_url?: string | null;
          system_prompt?: string | null;
          user_prompt?: string | null;
          revision_count?: number;
          revision_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kit_id?: string;
          name?: string;
          order_index?: number;
          html_css?: string | null;
          png_url?: string | null;
          uxml_url?: string | null;
          figma_url?: string | null;
          system_prompt?: string | null;
          user_prompt?: string | null;
          revision_count?: number;
          revision_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompt_templates: {
        Row: {
          id: string;
          step: "parser" | "design_system" | "screen_generator" | "state_generator" | "suggestion";
          category: "game" | "mobile" | "web" | "universal";
          version: number;
          is_active: boolean;
          system_prompt: string;
          user_template: string;
          model: string;
          temperature: number;
          max_tokens: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          step: "parser" | "design_system" | "screen_generator" | "state_generator" | "suggestion";
          category: "game" | "mobile" | "web" | "universal";
          version?: number;
          is_active?: boolean;
          system_prompt: string;
          user_template: string;
          model?: string;
          temperature?: number;
          max_tokens?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          step?: "parser" | "design_system" | "screen_generator" | "state_generator" | "suggestion";
          category?: "game" | "mobile" | "web" | "universal";
          version?: number;
          is_active?: boolean;
          system_prompt?: string;
          user_template?: string;
          model?: string;
          temperature?: number;
          max_tokens?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      generation_logs: {
        Row: {
          id: string;
          kit_id: string;
          step: string;
          prompt_template_id: string | null;
          model_used: string;
          input_tokens: number;
          output_tokens: number;
          duration_ms: number;
          status: "success" | "failed";
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kit_id: string;
          step: string;
          prompt_template_id?: string | null;
          model_used: string;
          input_tokens?: number;
          output_tokens?: number;
          duration_ms?: number;
          status: "success" | "failed";
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kit_id?: string;
          step?: string;
          prompt_template_id?: string | null;
          model_used?: string;
          input_tokens?: number;
          output_tokens?: number;
          duration_ms?: number;
          status?: "success" | "failed";
          error_message?: string | null;
          created_at?: string;
        };
      };
      admin_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      try_consume_generation: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      reset_monthly_generations: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}