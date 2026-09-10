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
      apuracao_semente: {
        Row: {
          ano: number
          apuracao_id: string
          folha: number
          id: string
          mes: number
          rbt: number
        }
        Insert: {
          ano: number
          apuracao_id: string
          folha?: number
          id?: string
          mes: number
          rbt?: number
        }
        Update: {
          ano?: number
          apuracao_id?: string
          folha?: number
          id?: string
          mes?: number
          rbt?: number
        }
        Relationships: [
          {
            foreignKeyName: "apuracao_semente_apuracao_id_fkey"
            columns: ["apuracao_id"]
            isOneToOne: false
            referencedRelation: "apuracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      apuracoes: {
        Row: {
          ano_inicial: number
          ano_tabela: number
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          mes_inicial: number
        }
        Insert: {
          ano_inicial: number
          ano_tabela: number
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          mes_inicial: number
        }
        Update: {
          ano_inicial?: number
          ano_tabela?: number
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          mes_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "apuracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          anexo_predominante: string
          atividade: string | null
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          anexo_predominante?: string
          atividade?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          anexo_predominante?: string
          atividade?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      lancamentos_mensais: {
        Row: {
          ano: number
          apuracao_id: string
          created_at: string
          fat_anexo_i: number
          fat_anexo_ii: number
          fat_anexo_iii: number
          fat_anexo_iv: number
          fat_anexo_v: number
          folha: number
          id: string
          isento_icms: number
          isento_ipi: number
          isento_iss: number
          isento_pis_cofins: number
          mes: number
          updated_at: string
        }
        Insert: {
          ano: number
          apuracao_id: string
          created_at?: string
          fat_anexo_i?: number
          fat_anexo_ii?: number
          fat_anexo_iii?: number
          fat_anexo_iv?: number
          fat_anexo_v?: number
          folha?: number
          id?: string
          isento_icms?: number
          isento_ipi?: number
          isento_iss?: number
          isento_pis_cofins?: number
          mes: number
          updated_at?: string
        }
        Update: {
          ano?: number
          apuracao_id?: string
          created_at?: string
          fat_anexo_i?: number
          fat_anexo_ii?: number
          fat_anexo_iii?: number
          fat_anexo_iv?: number
          fat_anexo_v?: number
          folha?: number
          id?: string
          isento_icms?: number
          isento_ipi?: number
          isento_iss?: number
          isento_pis_cofins?: number
          mes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_mensais_apuracao_id_fkey"
            columns: ["apuracao_id"]
            isOneToOne: false
            referencedRelation: "apuracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_empresa: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          perc_encargo_patronal: number
          perc_icms: number
          perc_inss_prolabore: number
          perc_ipi: number
          perc_iss: number
          perc_presuncao_comercio: number
          perc_presuncao_servico: number
          prolabore_padrao: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          perc_encargo_patronal?: number
          perc_icms?: number
          perc_inss_prolabore?: number
          perc_ipi?: number
          perc_iss?: number
          perc_presuncao_comercio?: number
          perc_presuncao_servico?: number
          prolabore_padrao?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          perc_encargo_patronal?: number
          perc_icms?: number
          perc_inss_prolabore?: number
          perc_ipi?: number
          perc_iss?: number
          perc_presuncao_comercio?: number
          perc_presuncao_servico?: number
          prolabore_padrao?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parametros_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tabela_icms_reducao_pr: {
        Row: {
          aliquota_nominal_icms_pr: number
          ano_vigencia: number
          created_at: string
          faixa: number
          id: string
          receita_max: number | null
          receita_min: number
          tipo: string
          valor_deduzir_icms_pr: number
        }
        Insert: {
          aliquota_nominal_icms_pr?: number
          ano_vigencia: number
          created_at?: string
          faixa: number
          id?: string
          receita_max?: number | null
          receita_min: number
          tipo: string
          valor_deduzir_icms_pr?: number
        }
        Update: {
          aliquota_nominal_icms_pr?: number
          ano_vigencia?: number
          created_at?: string
          faixa?: number
          id?: string
          receita_max?: number | null
          receita_min?: number
          tipo?: string
          valor_deduzir_icms_pr?: number
        }
        Relationships: []
      }
      tabela_simples_nacional: {
        Row: {
          aliquota_nominal: number
          anexo: string
          ano_vigencia: number
          created_at: string
          faixa: number
          id: string
          iss_fixo_percentual: number | null
          limite_aliquota_efetiva_iss: number | null
          peso_redist_cofins: number | null
          peso_redist_cpp: number | null
          peso_redist_csll: number | null
          peso_redist_irpj: number | null
          peso_redist_pis: number | null
          receita_max: number | null
          receita_min: number
          rep_cofins: number
          rep_cpp: number
          rep_csll: number
          rep_icms: number
          rep_ipi: number
          rep_irpj: number
          rep_iss: number
          rep_pis: number
          valor_deduzir: number
        }
        Insert: {
          aliquota_nominal: number
          anexo: string
          ano_vigencia: number
          created_at?: string
          faixa: number
          id?: string
          iss_fixo_percentual?: number | null
          limite_aliquota_efetiva_iss?: number | null
          peso_redist_cofins?: number | null
          peso_redist_cpp?: number | null
          peso_redist_csll?: number | null
          peso_redist_irpj?: number | null
          peso_redist_pis?: number | null
          receita_max?: number | null
          receita_min: number
          rep_cofins?: number
          rep_cpp?: number
          rep_csll?: number
          rep_icms?: number
          rep_ipi?: number
          rep_irpj?: number
          rep_iss?: number
          rep_pis?: number
          valor_deduzir?: number
        }
        Update: {
          aliquota_nominal?: number
          anexo?: string
          ano_vigencia?: number
          created_at?: string
          faixa?: number
          id?: string
          iss_fixo_percentual?: number | null
          limite_aliquota_efetiva_iss?: number | null
          peso_redist_cofins?: number | null
          peso_redist_cpp?: number | null
          peso_redist_csll?: number | null
          peso_redist_irpj?: number | null
          peso_redist_pis?: number | null
          receita_max?: number | null
          receita_min?: number
          rep_cofins?: number
          rep_cpp?: number
          rep_csll?: number
          rep_icms?: number
          rep_ipi?: number
          rep_irpj?: number
          rep_iss?: number
          rep_pis?: number
          valor_deduzir?: number
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
