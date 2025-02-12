export interface RatingSchemeMappingType {
    id: number;
    template_id: number;
    template_version: number;
    rating_scheme_id: number;
    rating_scheme_version: number;
    created_by: number;
    created_at: Date;
    updated_by?: any;
    updated_at?: any;
    rating_scheme_name: string;
    template_name: string;
    rating_scale_id: number;
    rating_scale_version: number;
    rating_scale_mode: string;
    rating_level: string;
    project_level_rating_calculation_type: string;
    project_level_rating_scale_id: number;
    project_level_rating_scale_mode: string;
}
