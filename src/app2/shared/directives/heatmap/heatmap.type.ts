export type HeatMapType = {
  orientation: string;
  data: {
    entity_name: string;
    entity_name_without_dates: string;
    key: string;
    column: number;
    value: number;
    weight: number;
    chartText?: any;
    scoreValue?: any;
    colorVal: number;
    isCategory: boolean;
    isFinalScore: boolean;
    rating_scale_id: number;
    rating_scale_name: string;
    category_level: number;
  }[];
};
