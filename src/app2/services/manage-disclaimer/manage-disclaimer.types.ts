export type DisclaimerRequestType = {
  name: string;
  text: string;
};

export interface IDisclaimerObject {
  id: number;
  name: string;
  is_active: boolean;
  text: string;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  usage: number;
  created_by_name?: any;
  updated_by_name?: any;
}
