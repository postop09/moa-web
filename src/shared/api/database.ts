export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      categories: {
        Row: {
          budget: number | null;
          created_at: string;
          householdId: string;
          id: number;
          name: string;
          type: Database['public']['Enums']['transaction type'];
        };
        Insert: {
          budget?: number | null;
          created_at?: string;
          householdId: string;
          id?: number;
          name: string;
          type: Database['public']['Enums']['transaction type'];
        };
        Update: {
          budget?: number | null;
          created_at?: string;
          householdId?: string;
          id?: number;
          name?: string;
          type?: Database['public']['Enums']['transaction type'];
        };
        Relationships: [
          {
            foreignKeyName: 'categories_householdId_fkey';
            columns: ['householdId'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      'household-members': {
        Row: {
          householdId: string;
          id: number;
          joinedAt: string;
          role: Database['public']['Enums']['role'];
          userId: string;
        };
        Insert: {
          householdId: string;
          id?: number;
          joinedAt?: string;
          role: Database['public']['Enums']['role'];
          userId: string;
        };
        Update: {
          householdId?: string;
          id?: number;
          joinedAt?: string;
          role?: Database['public']['Enums']['role'];
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'household-members_householdId_fkey';
            columns: ['householdId'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'household-members_userId_fkey';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      households: {
        Row: {
          createdAt: string;
          id: string;
          name: string;
          ownerId: string;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          id?: string;
          name?: string;
          ownerId: string;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          id?: string;
          name?: string;
          ownerId?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'households_ownerId_fkey';
            columns: ['ownerId'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          createdAt: string;
          email: string;
          id: string;
          nickname: string;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          email?: string;
          id: string;
          nickname?: string;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          email?: string;
          id?: string;
          nickname?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          categoryId: number | null;
          createdBy: string;
          createdDt: string;
          householdId: string;
          id: number;
          isRecurring: boolean | null;
          memo: string | null;
          name: string | null;
          transactionDt: string;
          type: Database['public']['Enums']['transaction type'];
          updatedDt: string;
        };
        Insert: {
          amount: number;
          categoryId?: number | null;
          createdBy: string;
          createdDt?: string;
          householdId: string;
          id?: number;
          isRecurring?: boolean | null;
          memo?: string | null;
          name?: string | null;
          transactionDt?: string;
          type: Database['public']['Enums']['transaction type'];
          updatedDt?: string;
        };
        Update: {
          amount?: number;
          categoryId?: number | null;
          createdBy?: string;
          createdDt?: string;
          householdId?: string;
          id?: number;
          isRecurring?: boolean | null;
          memo?: string | null;
          name?: string | null;
          transactionDt?: string;
          type?: Database['public']['Enums']['transaction type'];
          updatedDt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_categoryId_fkey';
            columns: ['categoryId'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_createdBy_fkey';
            columns: ['createdBy'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_householdId_fkey';
            columns: ['householdId'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_household_member: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      is_household_owner: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      shares_household_with: { Args: { p_user_id: string }; Returns: boolean };
    };
    Enums: {
      role: 'owner' | 'member';
      'transaction type': 'income' | 'expense';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      role: ['owner', 'member'],
      'transaction type': ['income', 'expense'],
    },
  },
} as const;
