export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password_hash: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password_hash?: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          task_name: string;
          publish_account: string;
          advance_amount: number;
          cooperation_method: string;
          cooperation_requirements: string;
          product_amount: number;
          manuscript_fee: number;
          commission_rate: number;
          handling_fee_rate: number;
          net_amount: number;
          commission_amount: number;
          due_date: string;
          required_posts: number;
          published_posts: number;
          completion_degree: number;
          completion_date: string | null;
          is_settled: boolean;
          settlement_date: string | null;
          is_commissioned: boolean;
          commission_date: string | null;
          is_advance_reimbursed: boolean;
          remarks: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_name?: string;
          publish_account?: string;
          advance_amount?: number;
          cooperation_method?: string;
          cooperation_requirements?: string;
          product_amount?: number;
          manuscript_fee?: number;
          commission_rate?: number;
          handling_fee_rate?: number;
          net_amount?: number;
          commission_amount?: number;
          due_date?: string;
          required_posts?: number;
          published_posts?: number;
          completion_degree?: number;
          completion_date?: string | null;
          is_settled?: boolean;
          settlement_date?: string | null;
          is_commissioned?: boolean;
          commission_date?: string | null;
          is_advance_reimbursed?: boolean;
          remarks?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_name?: string;
          publish_account?: string;
          advance_amount?: number;
          cooperation_method?: string;
          cooperation_requirements?: string;
          product_amount?: number;
          manuscript_fee?: number;
          commission_rate?: number;
          handling_fee_rate?: number;
          net_amount?: number;
          commission_amount?: number;
          due_date?: string;
          required_posts?: number;
          published_posts?: number;
          completion_degree?: number;
          completion_date?: string | null;
          is_settled?: boolean;
          settlement_date?: string | null;
          is_commissioned?: boolean;
          commission_date?: string | null;
          is_advance_reimbursed?: boolean;
          remarks?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      configs: {
        Row: {
          id: string;
          user_id: string;
          cooperation_methods: string[];
          cooperation_requirements: string[];
          publish_accounts: string[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cooperation_methods?: string[];
          cooperation_requirements?: string[];
          publish_accounts?: string[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cooperation_methods?: string[];
          cooperation_requirements?: string[];
          publish_accounts?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
