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
          created_at: string | null;
          id: string;
          order_id: string | null;
          price_at_time_of_order: number;
          product_id: string | null;
          quantity: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          price_at_time_of_order: number;
          product_id?: string | null;
          quantity: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          price_at_time_of_order?: number;
          product_id?: string | null;
          quantity?: number;
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
          created_at: string | null;
          delivery_pin: string | null;
          delivery_status: string | null;
          id: string;
          mobile_number: string | null;
          payment_method: string | null;
          payment_status: string | null;
          shipping_area: string | null;
          shipping_house_no: string | null;
          shipping_landmark: string | null;
          shipping_street: string | null;
          status: string | null;
          total_amount: number;
          user_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string | null;
          delivery_pin?: string | null;
          delivery_status?: string | null;
          id?: string;
          mobile_number?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          shipping_area?: string | null;
          shipping_house_no?: string | null;
          shipping_landmark?: string | null;
          shipping_street?: string | null;
          status?: string | null;
          total_amount: number;
          user_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string | null;
          delivery_pin?: string | null;
          delivery_status?: string | null;
          id?: string;
          mobile_number?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          shipping_area?: string | null;
          shipping_house_no?: string | null;
          shipping_landmark?: string | null;
          shipping_street?: string | null;
          status?: string | null;
          total_amount?: number;
          user_id?: string | null;
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
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          price: number;
          specifications: Json | null;
          stock: number | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          price: number;
          specifications?: Json | null;
          stock?: number | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          price?: number;
          specifications?: Json | null;
          stock?: number | null;
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
          area: string | null;
          created_at: string | null;
          full_name: string | null;
          house_no: string | null;
          id: string;
          landmark: string | null;
          mobile_number: string | null;
          role: string | null;
          street: string | null;
          updated_at: string | null;
        };
        Insert: {
          area?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          house_no?: string | null;
          id: string;
          landmark?: string | null;
          mobile_number?: string | null;
          role?: string | null;
          street?: string | null;
          updated_at?: string | null;
        };
        Update: {
          area?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          house_no?: string | null;
          id?: string;
          landmark?: string | null;
          mobile_number?: string | null;
          role?: string | null;
          street?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
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
        };
        Returns: string;
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
