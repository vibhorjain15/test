// Firm setting level assignment
export interface Assignment {
  id?: number;
  assigned_to_user_id?: number;
  assigned_to_function_id?: any;
  is_mandatory: boolean;
  duration?: number;
  is_active?: boolean;
  reviewStepDefinitionId?: number;
  entity_id?: number;
  entity_type?: string;
  due_at?: Date | string;
}

export interface Step {
  assignments: Assignment[];
  order: number;
  no_of_approval_required: number;
  is_active: boolean;
  id?: number;
}

export interface Definition {
  steps: Step[];
  id: number;
  name: string;
  review_filter_id: any;
  created_by_name: string;
  created_at: string;
  updated_by_name?: any;
  updated_at?: any;
  last_updated_at?: string;
  last_updated_by: string;
}

// Question level assignment object model
export interface AssignReviewDefinition {
  id: number;
  entity_id: number;
  entity_type: string;
  diligence_id: number;
  review_type: string;
  current_step_id: number;
  back_to_author: boolean;
  created_by: number;
  created_at: string;
  firm_id: number;
  completed_by?: any;
  completed_at?: any;
  is_completed: boolean;
  is_active: boolean;
  steps: ReviewStep[];
}

export interface ReviewAssignment {
  id: number;
  review_id: number;
  review_step_id: number;
  assigned_to_user_id?: any;
  assigned_to_function_id: number;
  assigned_by: number;
  assigned_at: string;
  completed_by?: any;
  completed_at?: any;
  status: string;
  is_mandatory: boolean;
  due_at: string;
  is_active: boolean;
  is_completed: boolean;
}

export interface ReviewStep {
  id: number;
  review_id: number;
  status: string;
  author_note?: any;
  no_of_approval_required: number;
  order: number;
  created_by: number;
  created_at: string;
  updated_by: number;
  updated_at: string;
  is_active: boolean;
  assignments: ReviewAssignment[];
  is_completed: boolean;
}
