import { Routes } from '@angular/router';
import { QaBankDuplicateComponent } from './pages/qa-bank-duplicate/qa-bank-duplicate.component';
import { QaBankTabsComponent } from './pages/qa-bank-tab/qa-bank-tabs.component';
import { QaBankCenterComponent } from './qa-bank/qa-bank.component';
import { CanAccessGaurd } from 'src/app2/guards/canAccess.gaurd';

const QABankRoutesNames = {
  QUESTIONS: 'questions',
  DUPLICATES: 'duplicates',
};

export const QA__BANK_ROUTES: Routes = [
  {
    path: '',
    component: QaBankTabsComponent,
  },
  {
    canActivate: [CanAccessGaurd],
    data: { hidden_from: ['investor'] },
    path: QABankRoutesNames.DUPLICATES,
    component: QaBankDuplicateComponent,
  },
];
