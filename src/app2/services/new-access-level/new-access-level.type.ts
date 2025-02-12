export interface AccessLevel {
  id: number;
  alias: string;
  name: string;
  can_clone: boolean;
  description: string;
  role_configuration: any;
  user_count: number;
}
