export interface DDDraftType {
  id: number;
  author_json: string;
  approver_json?: any;
  selected_entities?: any;
  firm_id: number;
  created_by: number;
  created_at: string;
  approved_by?: any;
  approved_at?: any;
  is_draft: boolean;
  draft_status: string;
  approver_ids: number[];
  entities: any[];
  created_by_name: string;
  approved_by_name?: any;
  project_due_at: string;
  project_as_of_date: string;
  project_name: string;
  draft_type?: string;
}

export interface Entity {
  Notification_contacts: number[];
  Id: number;
  Entity_type: number;
  Template_id: number;
  Due_at?: any;
  As_of_date?: any;
  Function_ids?: any;
}

export interface AuthorJsonType {
  Name: string;
  Entities: Entity[];
  Investor_id?: any;
  Created_by: number;
  Due_at: Date;
  Diligence_type: string;
  Firm_id: number;
  Diligence_reason?: any;
  Is_internal: boolean;
  Subject?: any;
  Email_text: string;
  As_of_date: Date;
  From_email: string;
  Cc_emails: string;
  Bcc_emails: string;
  Enable_PreSubmission_review: boolean;
  Enable_PostSubmission_review: boolean;
  Internal_notification_contacts: number[];
  Assign_owner_contacts: boolean;
  Is_draft: boolean;
  Is_approval_required: boolean;
  Approver_ids: number[];
  Author_notes?: any;
  Draft_id?: any;
  Approver_notes?: any;
  Draft_status: number;
  Function_ids: any[];
}
