import { Routes } from '@angular/router';
import { QuestionnaireComponent } from './page';

const QUESTIONNIARE_ROUTES_NAMES = {
  CATEGORY: 'category/:categoryId',
  QUESTION:'category/:categoryId/question/:questionId'
} as const;

export const QUESTIONNIARE_ROUTES: Routes = [
  {
    path: '',
    component: QuestionnaireComponent,
    children: [
      {
        path: QUESTIONNIARE_ROUTES_NAMES.CATEGORY,
        component: QuestionnaireComponent,
      },
      {
        path: QUESTIONNIARE_ROUTES_NAMES.QUESTION,
        component: QuestionnaireComponent,
      },
    ],
  },
  // {
  //   path: QUESTIONNIARE_ROUTES_NAMES.CATEGORY,
  //   component: QuestionnaireComponent,
  // },
];
