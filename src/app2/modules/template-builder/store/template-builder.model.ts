import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SectionType } from 'src/app2/apis/template/types/section.type';
import { TemplateType } from 'src/app2/apis/template/types/template.type';

export interface SubCategoriesType extends SectionType {
  catName: string;
  catId: number;
  isSelected: boolean;
  label: string;
}
export interface CategoriesType extends SectionType {
  isMultiSelect: false;
  isAllSelect: false;
  label: string;
  isOpen: true;
  list: {
    [id: string]: SubCategoriesType;
  };
}
interface Question extends QuestionType {
  isSelected: false;
}

export interface TemplateModel {
  categories: {
    [id: string]: CategoriesType;
  };
  error: any;
  categoryLoading: boolean;
  questionLoading: boolean;
  activeSection: number;
  questions: { [id: string]: { [id: string]: Question } };
  activeQuestionSection: number;
  templateId: string;
  totalSubCategories: number;
  totalCategories: number;
  template: TemplateType;
  activePanelId: string;
  categoryId: number;
  subCategoryId: number;
  entityScoreRules: any[];
}
