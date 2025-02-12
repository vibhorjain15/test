import { appRoutesNames } from 'src/app2/app.routes.name';
import { DocumentsGridComponent } from './documents-grid/documents-grid.component';

export const DOCUMENT_ROUTES = [
  {
    path: appRoutesNames.DOCUMENT,
    component: DocumentsGridComponent,
  },
];
