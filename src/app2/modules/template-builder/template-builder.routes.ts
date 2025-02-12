import { UrlMatchResult, UrlSegment } from '@angular/router';
import {
  EditTemplateComponent,
  ScoringComponent,
  TemplateBuilderComponent,
  TemplatePreviewComponent,
  TemplatePrintPreviewComponent,
} from './page';
import { CanAccessGaurd } from 'src/app2/guards/canAccess.gaurd';

export const templateBuilderRoutesNames = {
  PREVIEW: ':templateId/preview',
  SCORING: ':templateId/scoring',
  EDIT_QUESTIONS:
    ':templateId/categories/:categoryId/subcategories/:subcategoryId/questions',
  EDIT_SUBCAT:
    ':templateId/categories/:categoryId/subcategories/:subcategoryId',
  EDIT_ONLY_SUBCAT: ':templateId/categories/:categoryId/subcategories',
  EDIT_CAT: ':templateId/categories/:categoryId',
  EDIT_ONLY_CAT: ':templateId/categories',
  PRINT_PREVIEW: ':templateId/print_preview',
};
export const TEMPLATE_BUILDER_ROUTES = [
  {
    path: '',
    component: TemplateBuilderComponent,
    children: [
      {
        path: templateBuilderRoutesNames.PREVIEW,
        component: TemplatePreviewComponent,
      },
      {
        path: templateBuilderRoutesNames.PRINT_PREVIEW,
        component: TemplatePrintPreviewComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['manager'] },
        path: templateBuilderRoutesNames.SCORING,
        component: ScoringComponent,
      },
      {
        matcher: customMatcher,
        component: EditTemplateComponent,
      },
    ],
  },
];

export function htmlFiles(url: UrlSegment[]) {
  return { consumed: url };
}

function customMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length == 2 && segments[1].path === 'categories') {
    return {
      consumed: segments,
      posParams: {
        templateId: segments[0],
      },
    };
  }
  if (segments.length == 4 && segments[1].path === 'categories') {
    return {
      consumed: segments,
      posParams: {
        templateId: segments[0],
        categoryId: segments[2],
      },
    };
  }
  if (segments.length == 6 && segments[1].path === 'categories') {
    return {
      consumed: segments,
      posParams: {
        templateId: segments[0],
        categoryId: segments[2],
        subcategoryId: segments[4],
      },
    };
  }

  return null;
}
