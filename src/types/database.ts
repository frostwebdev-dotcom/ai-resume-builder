/**
 * Supabase `public` schema types — keep in sync with `supabase/migrations/*.sql`.
 * Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          role: "user" | "admin";
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          role?: "user" | "admin";
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          role?: "user" | "admin";
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          preview_image_path: string | null;
          is_active: boolean;
          is_premium: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          preview_image_path?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          preview_image_path?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resume_projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          slug: string;
          status: "draft" | "archived" | "published";
          template_id: string | null;
          metadata: Json;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          slug: string;
          status?: "draft" | "archived" | "published";
          template_id?: string | null;
          metadata?: Json;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          slug?: string;
          status?: "draft" | "archived" | "published";
          template_id?: string | null;
          metadata?: Json;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resume_projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resume_projects_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      resume_sections: {
        Row: {
          id: string;
          project_id: string;
          section_type: string;
          sort_order: number;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          section_type: string;
          sort_order?: number;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          section_type?: string;
          sort_order?: number;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resume_sections_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "resume_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      resume_versions: {
        Row: {
          id: string;
          project_id: string;
          section_id: string | null;
          version_number: number;
          parent_version_id: string | null;
          content_snapshot: Json;
          source: "user" | "ai" | "import" | "merge";
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          section_id?: string | null;
          version_number: number;
          parent_version_id?: string | null;
          content_snapshot: Json;
          source: "user" | "ai" | "import" | "merge";
          label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          section_id?: string | null;
          version_number?: number;
          parent_version_id?: string | null;
          content_snapshot?: Json;
          source?: "user" | "ai" | "import" | "merge";
          label?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resume_versions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "resume_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resume_versions_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "resume_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      job_targets: {
        Row: {
          id: string;
          project_id: string;
          title: string | null;
          company: string | null;
          job_description: string | null;
          keywords: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title?: string | null;
          company?: string | null;
          job_description?: string | null;
          keywords?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string | null;
          company?: string | null;
          job_description?: string | null;
          keywords?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_targets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "resume_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          stripe_checkout_session_id: string | null;
          product_sku: string;
          amount_cents: number;
          currency: string;
          status: "pending" | "processing" | "completed" | "failed" | "refunded";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          stripe_checkout_session_id?: string | null;
          product_sku: string;
          amount_cents: number;
          currency?: string;
          status?: "pending" | "processing" | "completed" | "failed" | "refunded";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          stripe_checkout_session_id?: string | null;
          product_sku?: string;
          amount_cents?: number;
          currency?: string;
          status?: "pending" | "processing" | "completed" | "failed" | "refunded";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "resume_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          amount_cents: number;
          currency: string;
          status: string;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          amount_cents: number;
          currency?: string;
          status: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          amount_cents?: number;
          currency?: string;
          status?: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      downloads: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          resume_version_id: string | null;
          order_id: string | null;
          storage_path: string;
          file_name: string | null;
          mime_type: string;
          bytes: number | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          resume_version_id?: string | null;
          order_id?: string | null;
          storage_path: string;
          file_name?: string | null;
          mime_type?: string;
          bytes?: number | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          resume_version_id?: string | null;
          order_id?: string | null;
          storage_path?: string;
          file_name?: string | null;
          mime_type?: string;
          bytes?: number | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "downloads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "downloads_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "resume_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_generation_logs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          section_id: string | null;
          provider: string;
          model: string | null;
          prompt_hash: string | null;
          tokens_prompt: number | null;
          tokens_completion: number | null;
          latency_ms: number | null;
          ok: boolean;
          error_code: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          section_id?: string | null;
          provider?: string;
          model?: string | null;
          prompt_hash?: string | null;
          tokens_prompt?: number | null;
          tokens_completion?: number | null;
          latency_ms?: number | null;
          ok?: boolean;
          error_code?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          section_id?: string | null;
          provider?: string;
          model?: string | null;
          prompt_hash?: string | null;
          tokens_prompt?: number | null;
          tokens_completion?: number | null;
          latency_ms?: number | null;
          ok?: boolean;
          error_code?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_suggestions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          kind: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          kind: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          kind?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage_limits: {
        Row: {
          id: string;
          user_id: string;
          bucket: string;
          used_count: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bucket: string;
          used_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bucket?: string;
          used_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          changes: Json | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          changes?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          changes?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/** Convenience row aliases */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Template = Database["public"]["Tables"]["templates"]["Row"];
export type ResumeProject = Database["public"]["Tables"]["resume_projects"]["Row"];
export type ResumeSection = Database["public"]["Tables"]["resume_sections"]["Row"];
export type ResumeVersion = Database["public"]["Tables"]["resume_versions"]["Row"];
export type JobTarget = Database["public"]["Tables"]["job_targets"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Download = Database["public"]["Tables"]["downloads"]["Row"];
export type AiGenerationLog = Database["public"]["Tables"]["ai_generation_logs"]["Row"];
export type AiSuggestion = Database["public"]["Tables"]["ai_suggestions"]["Row"];
export type AiUsageLimit = Database["public"]["Tables"]["ai_usage_limits"]["Row"];
export type AdminAuditLog = Database["public"]["Tables"]["admin_audit_logs"]["Row"];
