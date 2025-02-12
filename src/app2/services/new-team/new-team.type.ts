export interface IEntity {
  id: number;
  team_id: number;
  user_id: number;
  role_id: number;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  is_active: boolean;
  team_name: string;
  user_name: string;
  role_name: string;
}
