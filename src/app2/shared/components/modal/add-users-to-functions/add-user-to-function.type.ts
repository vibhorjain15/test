export interface UserAssigmentType {
  user_id: number;
  user_name: string;
}

export interface FunctionType {
  function_id: number;
  function_name: string;
  assigned_to_function?: any;
  user_assigments: UserAssigmentType[];
}
