export interface Value {
  group_id: number;
  key: string;
  value: number;
  score_value: string;
  weightage: number;
  order: number;
  rating_scale_id: number;
  rating_scale_name: string;
  category_level: number;
  question_ratings: Value[];
}

export interface Rating {
  key: string;
  group_id: number;
  order: number;
  value: Value[];
}

export interface IRatingSchemeService {
  duediligence_id: number;
  name?: any;
  entity_id: number;
  entity_name: string;
  description?: any;
  ratings: Rating[];
  total_score: string;
  total_rating: number;
  tag_string?: any;
  as_of_date: string;
  entity_name_without_dates: string;
  recalculation_needed: boolean;
  tags: any[];
  rating_scale_id: number;
  rating_scale_name: string;
}

export interface IRatingSchemeServiceRoot {
  computed: IRatingSchemeService[];
  data: IRatingSchemeService[];
}
