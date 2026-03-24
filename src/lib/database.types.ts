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
      agent_ratings: {
        Row: {
          agent_id: string | null;
          comment: string | null;
          created_at: string | null;
          id: string;
          order_id: string | null;
          rating: number | null;
          user_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          rating?: number | null;
          user_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          rating?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_ratings_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_ratings_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      agents: {
        Row: {
          average_rating: number | null;
          created_at: string | null;
          full_name: string;
          id: string;
          is_active: boolean | null;
          license_number: string | null;
          phone_number: string;
          salary: number | null;
          status: string | null;
          total_orders: number | null;
          user_id: string | null;
          vehicle_type: string | null;
          working_area: string | null;
        };
        Insert: {
          average_rating?: number | null;
          created_at?: string | null;
          full_name: string;
          id?: string;
          is_active?: boolean | null;
          license_number?: string | null;
          phone_number: string;
          salary?: number | null;
          status?: string | null;
          total_orders?: number | null;
          user_id?: string | null;
          vehicle_type?: string | null;
          working_area?: string | null;
        };
        Update: {
          average_rating?: number | null;
          created_at?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean | null;
          license_number?: string | null;
          phone_number?: string;
          salary?: number | null;
          status?: string | null;
          total_orders?: number | null;
          user_id?: string | null;
          vehicle_type?: string | null;
          working_area?: string | null;
        };
        Relationships: [];
      };
      admin_invites: {
        Row: {
          accepted_by: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          invite_token: string;
          invited_by: string;
          invited_email: string;
          status: string;
        };
        Insert: {
          accepted_by?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          invite_token: string;
          invited_by: string;
          invited_email: string;
          status?: string;
        };
        Update: {
          accepted_by?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          invite_token?: string;
          invited_by?: string;
          invited_email?: string;
          status?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          balance: number;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          created_at: string;
          id: string;
          referred_id: string;
          referral_code_used: string;
          referrer_id: string;
          reward_amount: number;
          reward_order_id: string | null;
          rewarded_at: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          referred_id: string;
          referral_code_used: string;
          referrer_id: string;
          reward_amount?: number;
          reward_order_id?: string | null;
          rewarded_at?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          referred_id?: string;
          referral_code_used?: string;
          referrer_id?: string;
          reward_amount?: number;
          reward_order_id?: string | null;
          rewarded_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_reward_order_id_fkey";
            columns: ["reward_order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      wallet_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          id: string;
          order_id: string | null;
          referral_id: string | null;
          source_type: string;
          transaction_type: string;
          wallet_user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          order_id?: string | null;
          referral_id?: string | null;
          source_type: string;
          transaction_type: string;
          wallet_user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          order_id?: string | null;
          referral_id?: string | null;
          source_type?: string;
          transaction_type?: string;
          wallet_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallet_transactions_referral_id_fkey";
            columns: ["referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          commission_per_kg: number;
          created_at: string | null;
          final_price_per_kg: number;
          id: string;
          order_id: string | null;
          price_at_time_of_order: number;
          product_id: string | null;
          quantity: number;
          real_price_per_kg: number;
          selected_weight_grams: number;
        };
        Insert: {
          commission_per_kg?: number;
          created_at?: string | null;
          final_price_per_kg?: number;
          id?: string;
          order_id?: string | null;
          price_at_time_of_order: number;
          product_id?: string | null;
          quantity: number;
          real_price_per_kg?: number;
          selected_weight_grams?: number;
        };
        Update: {
          commission_per_kg?: number;
          created_at?: string | null;
          final_price_per_kg?: number;
          id?: string;
          order_id?: string | null;
          price_at_time_of_order?: number;
          product_id?: string | null;
          quantity?: number;
          real_price_per_kg?: number;
          selected_weight_grams?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          agent_id: string | null;
          assigned_agent_id: string | null;
          created_at: string | null;
          delivery_batch: string | null;
          delivery_batch_date: string | null;
          delivery_pin: string | null;
          delivery_status: string | null;
          final_amount_due: number;
          id: string;
          mobile_number: string | null;
          payment_method: string | null;
          payment_status: string | null;
          referral_reward_processed: boolean;
          shipping_area: string | null;
          shipping_house_no: string | null;
          shipping_landmark: string | null;
          shipping_street: string | null;
          status: string | null;
          total_amount: number;
          user_id: string | null;
          wallet_amount_used: number;
        };
        Insert: {
          agent_id?: string | null;
          assigned_agent_id?: string | null;
          created_at?: string | null;
          delivery_batch?: string | null;
          delivery_batch_date?: string | null;
          delivery_pin?: string | null;
          delivery_status?: string | null;
          final_amount_due?: number;
          id?: string;
          mobile_number?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          referral_reward_processed?: boolean;
          shipping_area?: string | null;
          shipping_house_no?: string | null;
          shipping_landmark?: string | null;
          shipping_street?: string | null;
          status?: string | null;
          total_amount: number;
          user_id?: string | null;
          wallet_amount_used?: number;
        };
        Update: {
          agent_id?: string | null;
          assigned_agent_id?: string | null;
          created_at?: string | null;
          delivery_batch?: string | null;
          delivery_batch_date?: string | null;
          delivery_pin?: string | null;
          delivery_status?: string | null;
          final_amount_due?: number;
          id?: string;
          mobile_number?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          referral_reward_processed?: boolean;
          shipping_area?: string | null;
          shipping_house_no?: string | null;
          shipping_landmark?: string | null;
          shipping_street?: string | null;
          status?: string | null;
          total_amount?: number;
          user_id?: string | null;
          wallet_amount_used?: number;
        };
        Relationships: [
          {
            foreignKeyName: "orders_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string | null;
          commission: number;
          created_at: string | null;
          description: string | null;
          final_price: number;
          id: string;
          image_url: string | null;
          name: string;
          real_price: number;
          specifications: Json | null;
        };
        Insert: {
          category_id?: string | null;
          commission?: number;
          created_at?: string | null;
          description?: string | null;
          final_price?: never;
          id?: string;
          image_url?: string | null;
          name: string;
          real_price: number;
          specifications?: Json | null;
        };
        Update: {
          category_id?: string | null;
          commission?: number;
          created_at?: string | null;
          description?: string | null;
          final_price?: never;
          id?: string;
          image_url?: string | null;
          name?: string;
          real_price?: number;
          specifications?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          area: string | null;
          city: string | null;
          created_at: string | null;
          full_name: string | null;
          house_no: string | null;
          id: string;
          landmark: string | null;
          mobile_number: string | null;
          phone_number: string | null;
          pincode: string | null;
          referral_code: string | null;
          role: string | null;
          street: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          area?: string | null;
          city?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          house_no?: string | null;
          id: string;
          landmark?: string | null;
          mobile_number?: string | null;
          phone_number?: string | null;
          pincode?: string | null;
          referral_code?: string | null;
          role?: string | null;
          street?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          area?: string | null;
          city?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          house_no?: string | null;
          id?: string;
          landmark?: string | null;
          mobile_number?: string | null;
          phone_number?: string | null;
          pincode?: string | null;
          referral_code?: string | null;
          role?: string | null;
          street?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      product_catalog: {
        Row: {
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          created_at: string | null;
          description: string | null;
          final_price: number;
          id: string;
          image_url: string | null;
          name: string;
          price: number;
          specifications: Json | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_admin_invite: {
        Args: {
          p_invite_token: string;
        };
        Returns: undefined;
      };
      cancel_order_before_cutoff: {
        Args: {
          p_order_id: string;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      create_admin_invite: {
        Args: {
          p_invited_email: string;
        };
        Returns: {
          expires_at: string;
          invite_token: string;
          invited_email: string;
        }[];
      };
      get_current_batch_snapshot: {
        Args: Record<string, never>;
        Returns: {
          active_orders: number;
          batch_date: string;
          delivery_batch: string;
        }[];
      };
      get_referrer_preview: {
        Args: {
          p_referral_code: string;
        };
        Returns: {
          first_name: string | null;
          full_name: string | null;
        }[];
      };
      get_total_delivered_profit: {
        Args: Record<string, never>;
        Returns: number;
      };
      process_checkout: {
        Args: {
          p_items: Json;
          p_mobile_number: string;
          p_payment_method: string;
          p_shipping_area: string;
          p_shipping_house_no: string;
          p_shipping_landmark: string;
          p_shipping_street: string;
          p_total_amount: number;
          p_wallet_amount_requested: number;
        };
        Returns: string;
      };
      register_referral: {
        Args: {
          p_referral_code: string;
        };
        Returns: undefined;
      };
      verify_delivery_pin: {
        Args: {
          p_entered_pin: string;
          p_order_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
