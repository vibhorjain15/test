import { StringifyOptions } from 'querystring';
import {
  AssignReviewDefinition,
  ReviewAssignment,
  ReviewStep,
} from 'src/app2/shared/models/review-definitions.model';

export interface FirmInfo {
  notification_contacts: any[];
  id: number;
  name?: any;
  firm_type_id: number;
  subscription: string;
  accessProfile: number;
  website?: any;
  inceptionDate?: any;
  expiryDate: Date;
  aum: number;
  currency?: any;
  currencyID: number;
  contactPerson?: any;
  contacts?: any;
  firmDescription?: any;
  isInvestor: boolean;
  isDocToHtmlEnabled: boolean;
  api_key?: any;
  lastTouchPoint?: any;
  owner_user_id?: any;
  owner_name?: any;
  relationship_status_id?: any;
  relationship_status_name?: any;
  active: boolean;
  admin_user_email?: any;
  key?: any;
  alternate_name?: any;
  email_domain?: any;
  is_tracking: boolean;
  preferences?: any;
  allowRichTextarea: boolean;
  display_name?: any;
  is_owner: boolean;
  last_updated_at?: any;
  tag_ids?: any;
  permission_model?: any;
  permission_policies?: any;
  hasPermissionEnabled: boolean;
  permissions?: any;
  allowed_teams: number;
  ui_version: number;
  functions: any[];
}

export interface AuthorUser {
  associated_firms_count: number;
  referral_data?: any;
  is_default: boolean;
  userName?: any;
  password?: any;
  confirmPassword?: any;
  newPassword?: any;
  id: number;
  type: number;
  firstName?: any;
  lastName?: any;
  fullName?: any;
  firmInfo: FirmInfo;
  accessLevel: string;
  accessLevelID: number;
  isAdmin: boolean;
  isReadOnly: boolean;
  is_approver: boolean;
  active: boolean;
  country?: any;
  avatarURL?: any;
  title?: any;
  psk?: any;
  twoFactorEnabled: boolean;
  anonymous: boolean;
  bounced_at?: any;
  phone?: any;
  eucAccepted: boolean;
  group_by_intro: boolean;
  review_functionality_intro: boolean;
  discussEUCAccepted: boolean;
  isFirstLogin: boolean;
  firmAccessCount: number;
  conversionDateTime?: any;
  isFirstDD: boolean;
  isFirstTemplate: boolean;
  statusCode: number;
  fundId: number;
  lastTouchPoint?: any;
  owner_user_id?: any;
  owner_name?: any;
  contact_type_ids?: any;
  contact_types?: any;
  type_ids?: any;
  street_address_1?: any;
  street_address_2?: any;
  city?: any;
  state?: any;
  zipcode?: any;
  country_id: number;
  phone_1?: any;
  phone_2?: any;
  fax?: any;
  relationship_status_id: number;
  relationship_status?: any;
  associated_funds: any[];
  associated_programs: any[];
  associated_strategies: any[];
  lockoutEndDateUtc?: any;
  key?: any;
  firm_name: string;
  is_tracking: boolean;
  is_verified: boolean;
  is_owner: boolean;
  is_new_user: boolean;
  skip_tour: boolean;
  approved_by?: any;
  approved_at?: any;
  send_invitation: boolean;
  can_change_firm: boolean;
  last_updated_at?: any;
  api_key?: any;
  firmwide_role?: any;
  is_saml_enabled: boolean;
  platform_active: boolean;
  relationship_active: boolean;
}

export interface FirmInfo2 {
  notification_contacts: any[];
  id: number;
  name: string;
  firm_type_id: number;
  subscription: string;
  accessProfile: number;
  website?: any;
  inceptionDate?: any;
  expiryDate: Date;
  aum: number;
  currency?: any;
  currencyID: number;
  contactPerson?: any;
  contacts?: any;
  firmDescription?: any;
  isInvestor: boolean;
  isDocToHtmlEnabled: boolean;
  api_key?: any;
  lastTouchPoint?: any;
  owner_user_id?: any;
  owner_name?: any;
  relationship_status_id?: any;
  relationship_status_name?: any;
  active: boolean;
  admin_user_email?: any;
  key?: any;
  alternate_name?: any;
  email_domain?: any;
  is_tracking: boolean;
  preferences?: any;
  allowRichTextarea: boolean;
  display_name: string;
  is_owner: boolean;
  last_updated_at?: any;
  tag_ids?: any;
  permission_model?: any;
  permission_policies?: any;
  hasPermissionEnabled: boolean;
  permissions?: any;
  allowed_teams: number;
  ui_version: number;
  functions: any[];
}

export interface ResponseAuthor {
  associated_firms_count: number;
  referral_data?: any;
  is_default: boolean;
  userName?: any;
  password?: any;
  confirmPassword?: any;
  newPassword?: any;
  id: number;
  type: string;
  firstName: string;
  lastName: string;
  fullName: string;
  firmInfo: FirmInfo2;
  accessLevel: string;
  accessLevelID: number;
  isAdmin: boolean;
  isReadOnly: boolean;
  is_approver: boolean;
  active: boolean;
  country?: any;
  avatarURL?: any;
  title?: any;
  psk?: any;
  twoFactorEnabled: boolean;
  anonymous: boolean;
  bounced_at?: any;
  phone?: any;
  eucAccepted: boolean;
  group_by_intro: boolean;
  review_functionality_intro: boolean;
  discussEUCAccepted: boolean;
  isFirstLogin: boolean;
  firmAccessCount: number;
  conversionDateTime?: any;
  isFirstDD: boolean;
  isFirstTemplate: boolean;
  statusCode: number;
  fundId: number;
  lastTouchPoint?: any;
  owner_user_id?: any;
  owner_name?: any;
  contact_type_ids?: any;
  contact_types?: any;
  type_ids?: any;
  street_address_1?: any;
  street_address_2?: any;
  city?: any;
  state?: any;
  zipcode?: any;
  country_id: number;
  phone_1?: any;
  phone_2?: any;
  fax?: any;
  relationship_status_id: number;
  relationship_status?: any;
  associated_funds: any[];
  associated_programs: any[];
  associated_strategies: any[];
  lockoutEndDateUtc?: any;
  key?: any;
  firm_name: string;
  is_tracking: boolean;
  is_verified: boolean;
  is_owner: boolean;
  is_new_user: boolean;
  skip_tour: boolean;
  approved_by?: any;
  approved_at?: any;
  send_invitation: boolean;
  can_change_firm: boolean;
  last_updated_at?: any;
  api_key?: any;
  firmwide_role?: any;
  is_saml_enabled: boolean;
  platform_active: boolean;
  relationship_active: boolean;
}

export interface VerifierType {
  id: number;
  entity_id: number;
  entity_type: string;
  type: number;
  text?: any;
  created_by: number;
  completed_by?: any;
  created_at: Date;
  completed_at?: any;
  due_date: Date;
  is_complete: boolean;
  assigned_to: number;
  assigned_to_function_id?: any;
  assigned_to_function_name?: any;
  assigned_to_name: string;
  frequency?: any;
  is_active: boolean;
  created_by_name?: any;
  completed_by_name: string;
  parent_id: number;
  entity_name?: any;
  responses_todos?: any;
  rating_todos?: any;
  category_level: number;
}

export interface RatingMappingType {
  id: number;
  templateRatingMappings_id: number;
  section_id: number;
  question_id: number;
  rating_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  rating_name?: any;
  section_name?: any;
  question_text?: any;
  rating_value?: any;
  score_value?: any;
  rating_status: string;
  group_id: number;
  is_dirty: boolean;
  description?: any;
  response_id: number;
  verifier: VerifierType[];
  is_na: boolean;
}
export interface QuestionAttributeType {
  dueDiligenceID: number;
  sectionID: number;
  userID: number;
  group_id?: number;
  text: string;
  isValid: boolean;
  responseType: string;
  authorUser: AuthorUser;
  listDesignationID?: number;
  hint_text?: any;
  is_mandatory?: boolean;
  grid_id?: number;
  grid_version?: number;
  isPublic?: boolean;
  order?: number;
  response_count?: number;
  note_count?: number;
  issue_count: number;
  has_standardized_text?: boolean;
  is_na_entity_score_rule_id?: number;
  response_word_limit?: number;
  responseText: string;
  textResponse: string;
  dateTimeResponse?: any;
  dateResponse?: any;
  numericResponseA?: any;
  numericResponseB?: any;
  booleanResponse?: any;
  parent_id: number;
  questionValueID?: any;
  listValueID: any[];
  responseSource: string;
  responseTimeStamp?: Date | any;
  id?: number;
  sequenceID?: number | string;
  responseAuthor: ResponseAuthor;
  toDoCount?: number;
  followup_count: any;
  likedbyUsers?: any;
  responseDisplay: string;
  duediligence_id?: number;
  isDeleted?: boolean;
  is_NA?: boolean;
  isNested: boolean;
  is_WIP?: boolean;
  questionID?: number;
  questionText?: any;
  investorName?: any;
  fundName?: any;
  attachmentIds: any[];
  response_with_notes_attributes?: any;
  grid_responses?: any;
  returnTable_id?: number;
  aumTable_id?: number;
  is_inactive?: any;
  entityName?: any;
  templateName?: any;
  sectionId?: number;
  sectionName?: any;
  parentSectionName?: any;
  sectionOrder?: number;
  parentSectionOrder?: number;
  is_history?: boolean;
  response_type: string;
  score?: any;
  rating?: any;
  score_entity_score_rule_id?: number;
  is_flagged?: boolean;
  flag_entity_score_rule_id?: number;
  lastupdate_at?: Date;
  expiry_date?: any;
  selected_options?: any;
  template_id?: number;
  response_status: string;
  post_response_status: string;
  track_change_status: string;
  revision_counts?: number;
  response_comments_counts?: number;
  response_unresolved_comments_counts?: number;
  attachments?: any;
  comment_text?: any;
  question_group_id?: number;
  section_group_id?: number;
  is_validation_required?: boolean;
  templateRatingMappings_id?: number;
  section_id?: number;
  question_id?: any;
  rating_id?: number;
  created_by?: number;
  created_at?: Date;
  updated_by?: any;
  updated_at?: any;
  rating_name?: any;
  section_name?: any;
  question_text?: any;
  rating_value?: any;
  score_value?: any;
  rating_status: string;
  is_dirty?: boolean;
  description?: any;
  response_id?: number;
  templateID: number;
  operatorID: number;
  value: string;
  nestedQuestionId: number;
  active: boolean;
  insertTimeStamp: Date;
  displayValue?: any;
  deleted_response_id: any;
  // Static data for
  type: string;
  entity_id?: number;
  entity_type?: number; // question
  assigned_to?: number[];
  assigned_to_functions?: number[];
  deleted_at?;
  deleted_by?;
  //assignedUser full object
  selectedUser: any;
  //assignedUser
  assignedUser: {
    type: string;
    attributes: {
      entity_id?: number;
      entity_type?: number; // question
      assigned_to?: number[];
      assigned_to_functions?: number[];
    };
  };
  // answer
  answer: Included;
  localBooleanResponse: boolean;
  localNumericResponseA: Number;
  localNumericResponseB: Number;
  localResponseText: string;
  localDateResponse: any;
  explaination: string;
  icons: any;
  showComment?: boolean;
  options: { id: number; value: string; is_active: boolean; order: number }[];
  localAttachmentIds: any;
  copyResponseText: string;
  localTextResponse: string;
  localErrorState: string;
  localis_NA: boolean;
  localis_WIP: boolean;
  localis_validation_required: boolean;
  localListValueID: any;
  localgrid_responses: any;
  localaumTable_id: any;
  index: number;
  // custom local keys
  verifierEdit: boolean;
  verifier: VerifierType[];
  reviewFlowEdit: boolean;
  timeDiff: number;
  parentQuestionId: number;
  nestedQuestions: Included[];
  isAnswerReadonly: boolean;
  isTrackChange: boolean;
  is_submitted: boolean;
  is_submitted_by_investor: boolean;
  sectionRating: RatingMappingType;
  questionRating: RatingMappingType;

  // Added for track changes
  currentResponse: string;
  previousResponse: string;
  showTrackChangeButtons: boolean;

  commentPlaceholder: string;
  isOther: boolean; // added for other option
  booleanExplanation: string; // added for boolean explaination
  localbooleanExplanation: string; // added for boolean explaination
  otherExplanation: string; // added for checkbox/dropdown other
  canShowReviewComments: boolean;
  canShowNotes: boolean;

  rightIcons: any; // Added for storing the right icons
  isSectionUndo: boolean;
  is_valid: boolean;
  isSequence: boolean;
  assignments: AssignReviewDefinition;
  activeReviewStep: ReviewStep;
  currentReviewer: ReviewAssignment;
  isReadOnly: boolean;
  tempTextResponse: any;
  trigger_review: boolean;
  alreadyEdited: boolean; // attribute to stop answers going back to readonly mode if the edit was already made
  reviewLoading: boolean; // this is to prevent multiple clicks on approve/reject button

  /**
   * This is the Unique ID for each question used to bind resolve all comments in ckeditor side-panel
   */
  uniqueQuestionId: string;
}

export interface Included {
  type:
    | 'questions'
    | 'responses'
    | 'sequences'
    | 'section_rating_mapping'
    | 'question_rating_mapping'
    | 'nestingrules'
    | 'section_assignments'
    | 'attachments'
    | 'response_verify'
    | 'section_verify'
    | 'question_assignments'
    | 'question_rating_verify';
  id: number;
  attributes: QuestionAttributeType;
}
export interface QuestionRootType {
  data: any[];
  included: Included[];
}

/**
 * The question details which is used to close the side-panel
 * in-case the ckeditor is destroyed on scroll.
 */
export interface QuestionDetailsOnScroll {
  activePanelId: string;
  activeQuestionId: number;
  questions: Array<QuestionAttributeType>;
}
