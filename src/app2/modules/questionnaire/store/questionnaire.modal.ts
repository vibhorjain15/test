import { Observable } from 'rxjs';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { QuestionAttributeType } from '../types/questions.type';
import { RatingScaleDefType } from '../types/rating-scale-def.type';
import { ReviewMappingsData } from '../types/review-mappings-data.type';
import { SectionAttributes } from '../types/section.type';
import { AssignReviewDefinition } from 'src/app2/shared/models/review-definitions.model';

export interface QuestionCount {
  id: string;
  value: number;
}

export interface StateDiligenceUpdateType {
  isQuickFilter?: boolean;
  isReadOnly?: boolean;
  isLocked?: boolean;
  review_allowed?: boolean;
  alwaysOpen?: boolean;
  notVisible?: boolean;
  allowOnlyFollowups?: boolean;
  review_mandatory?: boolean;
  canDelete?: boolean;
  isCompleted?: boolean;
  hasReadOnlyAccess?: boolean;
  isReadonlyEditable?: boolean;
  isReadonlyNotEditable?: boolean;
  isEditable: boolean;
}

export interface QuestionnaireModel {
  fromfirmId: number;
  tofirmId: number;
  fundId: number;
  diligenceId: number;
  questionId: number;
  categoryId: number;
  subCatId: number;
  activeSection: { label: string; id: number; data: SectionAttributes };
  questionCounts: QuestionCount[];
  countLoader: boolean;
  error: string;
  diligenceLoader: boolean;
  diligence: DiligenceType & StateDiligenceUpdateType;
  categories: { [id: string]: SectionAttributes[] };
  questions: { [id: string]: QuestionAttributeType };
  subCatToCatMap: { [id: string]: string };
  draftData: {
    [id: string]: { [id: string]: { value: any; api: Observable<any> } };
  };
  activePanelId: string;
  attachmentMap: { [id: string]: any };
  filterStatus: string;
  localQuestionMap: any;
  nestedQuestionMap: any;
  searchQuery: string;
  selectedRatingScheme: any;
  rating_scheme_default: any;
  colorData: { [id: string]: RatingScaleDefType[] };
  sequenceMap: {
    [id: string]: { response: { [id: string]: QuestionAttributeType } };
  };
  reviewMappingsData: ReviewMappingsData;
  silentReload: string;
  localGridMap: any;
  customFieldDatamap: any;
  questionUserRoles: any;
  functionAssignment: any;
  responseHistory: any;
  followups: any;
  parentQuestionCount: any;
  reviewStatus: string;
  categoryLoading: boolean;
  sequenceSectionQuestionMap: {
    [sequenceId: string]: {
      [sectionId: string]: { [questionId: string]: QuestionAttributeType };
    };
  };
  introModalShown: boolean;
  sectionFilterCounter: {
    [questionId: string]: { unresolvedComments: number };
  };
  isDraftSave: string[];
  allSections: SectionAttributes[];
  responseTypeFromPanel: any[];
  assignments: {
    [responseId: number]: AssignReviewDefinition;
  };
  filterReload: String;
  entityScoreRules: any[];
  templateQuestions: any[];
  questionOptions: any;
  reviewCommentDataMap:
    | {
        [id: string]: any;
      }
    | any;
  isSequenceIdInRoute: boolean;
  reviewers: Map<number, string>;
  isReviewersVisible: boolean;
}
