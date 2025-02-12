export interface IDomain {
  id: number;
  firm_id: number;
  domain_name: string;
  is_sso_enabled: boolean;
  is_auto_approve_enabled: boolean;
  created_by: number;
  created_at: Date;
  updated_at?: Date;
  updated_by?: number;
}

export type DomainRequestType = {
  domain_name: string;
  is_sso_enabled: boolean;
  is_auto_approve_enabled: boolean;
};
