export interface IWorkFlowEntity {
  id: number;
  value: string;
  label: string;
  icon: string;
}

export interface IWorkflows {
  id: number;
  name: string;
  entity_type: string;
  entity_sub_type?: number;
  firm_id: number;
  created_at: Date;
  created_by: number;
  updated_at?: Date;
  updated_by?: number;
  active: boolean;
  usage: number;
  steps: ISteps[];
  baseworkflow_id?: any;

  // Added custum field index
  index?: number;
}

export interface IWorkflowRequest {
  name: string;
  entity_type: string;
  entity_sub_type: number;
  baseworkflow_id: number;
}

export interface IWorkflowUpdate {
  name: string;
  id: number;
  active: boolean;
}

interface User {
  id: number;
  workflow_steps_actions_id: number;
  user_id: number;
  function_id?: any;
  user_name?: any;
  user_email?: any;
  is_active: boolean;
}

interface Checklist {
  id: number;
  entity_id: number;
  entity_type: string;
  type?: any;
  text: string;
  created_by: number;
  completed_by?: any;
  created_at: Date;
  completed_at?: any;
  due_date?: any;
  is_complete: boolean;
  assigned_to?: any;
  assigned_to_function_id?: any;
  assigned_to_function_name?: any;
  assigned_to_name?: any;
  frequency?: any;
  is_active: boolean;
  created_by_name?: any;
  completed_by_name?: any;
  parent_id?: any;
  entity_name?: any;
  responses_todos?: any;
  rating_todos?: any;
  category_level: number;
}

export interface Action {
  id: number;
  workflow_steps_id: number;
  action_id: string;
  is_owner_task: boolean;
  users: User[];
  workflow_audit_id: number;
  duration_hours: number;
  duration_type: string;
  checklist: Checklist[];
}

export interface ISteps {
  id: number;
  name: string;
  description?: any;
  workflow_id: number;
  order: number;
  destination_index?: any;
  actions: Action[];
}
