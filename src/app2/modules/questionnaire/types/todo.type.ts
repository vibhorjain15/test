export interface TodoType {
  id: number;
  entity_id: number;
  entity_type: string;
  type?: any;
  text: string;
  created_by: number;
  completed_by?: string;
  created_at: string;
  completed_at?: Date;
  due_date?: string;
  is_complete: boolean;
  assigned_to?: any;
  assigned_to_function_id?: any;
  assigned_to_function_name?: any;
  assigned_to_name: string;
  frequency?: any;
  is_active: boolean;
  created_by_name?: string;
  completed_by_name?: string;
  parent_id?: any;
  entity_name?: string;
  responses_todos?: any;
  rating_todos?: any;
  category_level: number;
}

export interface TodoModel extends TodoType {
  loading: boolean;
}
