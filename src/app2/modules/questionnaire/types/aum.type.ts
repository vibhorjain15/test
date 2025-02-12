export interface AumDefinitionType {
    id: number;
    name: string;
    entity_type: string;
    entity_id: number;
    type: string;
    period: string;
    is_editable: boolean;
    created_by: number;
    created_at: Date;
    updated_by?: any;
    updated_at?: any;
    firm_id: number;
    shared_with_firm_id?: any;
    entity_name?: any;
    is_active: boolean;
    source_id: number;
    currency_id: number;
    currency_name: string;
    profile_type: string;
  }


  export interface AumGridType {
    id: number;
    start_date: string;
    end_date: string;
    value: number;
    aumtrackrecord_defintion_id: number;
    created_by: number;
    created_at: Date;
    updated_by?: any;
    updated_at?: any;
    start_year: number;
}
