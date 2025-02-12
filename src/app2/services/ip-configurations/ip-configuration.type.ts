export interface IIpConfigurations {
  id: number;
  name: string;
  start_ip: string;
  end_ip: string;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  is_active: boolean;

  number_of_IPs?: any;
}

export type IpRequestType = { name: string; start_ip: string; end_ip: string };
