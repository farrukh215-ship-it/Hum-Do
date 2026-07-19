export type Role = "husband" | "wife";
export type TransactionType = "income" | "expense";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          role: Role | null;
          household_id: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          role?: Role | null;
          household_id?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          role?: Role | null;
          household_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category: string;
          note: string | null;
          created_at: string;
          household_id: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category: string;
          note?: string | null;
          created_at?: string;
          household_id?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: TransactionType;
          amount?: number;
          category?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          invite_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          invite_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          household_id: string;
          category: string;
          monthly_limit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category: string;
          monthly_limit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          category?: string;
          monthly_limit?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_household: {
        Args: { p_name: string; p_role: Role };
        Returns: { household_id: string; invite_code: string }[];
      };
      find_household_by_invite_code: {
        Args: { p_code: string };
        Returns: { household_id: string | null; taken_roles: Role[] }[];
      };
      join_household: {
        Args: { p_code: string; p_name: string; p_role: Role };
        Returns: { household_id: string }[];
      };
    };
  };
}
