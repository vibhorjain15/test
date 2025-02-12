export interface IGetTeams {
  members: any[];
  id: number;
  name: string;
  description?: any;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by: number;
  updated_at: Date;
  is_active: boolean;
}

interface Function {
  function_id: number;
  function_name: string;
  user_id: number;
  assigned_to_function_id: number;
}

export interface IGetUsers {
  id: number;
  userName: string;
  title: string;
  firstname: string;
  lastname: string;
  dateOfBirth: Date;
  phoneNumber: string;
  firm_id: number;
  address: string;
  address_2?: any;
  city: string;
  state: string;
  country_id?: any;
  type: string;
  zipcode: string;
  updated_at: Date;
  created_at: Date;
  picture_url?: any;
  preSharedKey: string;
  eucFlag: boolean;
  discussFlag: boolean;
  introFlag: boolean;
  conversionDateTime: Date;
  is_active: boolean;
  firmwide_role: number;
  firmwide_role_name: string;
  skip_tour: boolean;
  approved_by: number;
  approved_at: Date;
  api_key?: any;
  fullName: string;
  invited_by_name: string;
  status: string;
  firm_name?: any;
  firm_logo?: any;
  lockoutEndDateUtc?: any;
  isLocked: boolean;
  bounced_at?: any;
  teamMemberships?: any;
  is_default: boolean;
  is_public: boolean;
  is_key_person: boolean;
  is_primary: boolean;
  is_tracking: boolean;
  has_bounce_history: boolean;
  internal_tags?: any;
  functions: Function[];
}

export interface IGetPermission {
  name: string;
  alias: string;
  description: string;
}

export interface IGetRole {
  id: number;
  name: string;
  alias: string;
  description: string;
}

export interface IResource {
  id: number;
  assigned_to_entity_type: string;
  assigned_to_entity_id: number;
  entity_type: string;
  entity_id: number;
  role_id: number;
  access_level?: any;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  is_active: boolean;
  role_name: string;
  assigned_to_name: string;
  entity_name: string;
  permission_type: number;
  allow_underlying_entities: boolean;
  is_default: boolean;
}

export interface ITeam {
  members: any[];
  id: number;
  name: string;
  description?: any;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  is_active: boolean;
}

export const HighestRoleObj: IGetRole = {
  id: -1,
  name: 'Highest Access Level',
  alias: 'Highest Access Level',
  description:
    'it will automatically set their permission access level to their highest existing access level that they have for any team or permission assignments. Example: If a user has contributor access to Product A and owner access to Template A, then they will automatically receive owner access by default.',
};
