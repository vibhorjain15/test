import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class EntityDocumentsService {
  constructor(
    private readonly http: HttpClient,
    private readonly datePipe: DatePipe
  ) {}

  private entityLoaded: BehaviorSubject<any>;
  entityLoaded$: Observable<any>;

  entityLoadedTrigger(entity) {
    this.entityLoaded.next(entity);
  }

  initializeEntityLoad() {
    this.entityLoaded = new BehaviorSubject<any>(null);
    this.entityLoaded$ = this.entityLoaded.asObservable();
  }

  unSubscribeEntityLoad() {
    this.entityLoaded.unsubscribe();
  }

  getDocumentListColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'blob_name',
      headerName: 'File Name',
      field: 'blob_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search File Name',
      },
      minWidth: grid_widths_map['sm_column_xxl'],
      sortable: true,
      cellRenderer: 'EmptyTextCellRenderer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'document_types',
      headerName: 'Document Types',
      field: 'document_types',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search Document Types',
      },
      cellRenderer: 'groupableFieldNameCellRenderer',
      minWidth: grid_widths_map['sm_column_xxl'],
      sortable: false,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'as_of_date',
      headerName: 'As of Date',
      field: 'as_of_date',
      minWidth: grid_widths_map['sm_column_sm'],
      comparator: dateSortNew('as_of_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'owner_firm_name',
      headerName: 'Owner Firm Name',
      field: 'owner_firm_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search by Firm Name',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'clickable',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'created_at',
      headerName: 'Uploaded On/Received On',
      field: 'created_at',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search by Date',
      },
      minWidth: grid_widths_map['sm_column_xm'],
      menuTabs: ['generalMenuTab'],
    });

    colDef.push({
      ...defaultColumn,
      colId: 'uploaded_shared_by',
      headerName: 'Uploaded By/Shared By',
      field: 'uploaded_shared_by',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search by Uploaded By/Shared By',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'clickable',
      hide: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'views',
      headerName: 'Views',
      field: 'views',
      sortable: false,
      minWidth: grid_widths_map['icon_xl'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'updated_by',
      headerName: 'Last Updated By',
      field: 'updated_by',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search by Last Updated By',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'clickable',
      hide: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'updated_at',
      headerName: 'Last Updated On',
      field: 'updated_at',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search by Date',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_xm'],
      cellClass: 'clickable',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'is_reviewed',
      headerName: 'Reviewed',
      field: 'is_reviewed',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_lg'],
      hide: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'reviewed_by',
      headerName: 'Reviewed By',
      field: 'reviewed_by',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_lg'],
      hide: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'review_count',
      headerName: '# of Reviews',
      field: 'review_count',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_lg'],
      hide: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_reviewed_date',
      headerName: 'Review Date',
      field: 'last_reviewed_date',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_lg'],
      hide: true,
      comparator: dateSortNew('last_reviewed_date'),
    });
    return colDef;
  }

  getDocumentListRowData(options, currentFirmId) {
    const url = options.q ? 'attachments/search' : 'attachmentassignments';
    let dateFormat = 'MMM dd, y';
    return this.http.get(url, { params: options }).pipe(
      map((response: any) => {
        return response
          .map((document) => ({
            document_name: document.name,
            document_types: document.tag_names,
            blob_name: document.blob_name,
            as_of_date: this.datePipe.transform(document.as_of_date),
            uploaded_by: document.created_by_name,
            views: document.view_count,
            is_reviewed:
              document.reviews && document.reviews.length > 0 ? 'Yes' : 'No',
            reviewed_by:
              document.reviews && document.reviews.length > 0
                ? document.reviews.map((review) => review.created_by_name)
                : null,
            review_count: document.reviews ? document.reviews.length : 0,
            last_reviewed_date:
              document.reviews && document.reviews.length > 0
                ? this.datePipe.transform(document.reviews[0].created_at)
                : null,
            owner_firm_name: document.owner_firm_name || '',
            created_at: this.datePipe.transform(
              document.created_at,
              dateFormat
            ),
            updated_at: document.updated_at
              ? this.datePipe.transform(document.updated_at, dateFormat)
              : this.datePipe.transform(document.created_at, dateFormat),
            updated_at_datetime: document.updated_at
              ? new Date(document.updated_at)
              : currentFirmId == document.owner_firm_id
              ? new Date(document.created_at)
              : new Date(document.received_at),
            updated_by: document.updated_by_name?.trim()?.length
              ? document.updated_by_name
              : document.created_by_name,
            uploaded_shared_by:
              document.owner_firm_id == currentFirmId
                ? document.created_by_name
                : document.shared_by_name,
            document,
          }))
          .sort((doc1, doc2) =>
            doc1.updated_at_datetime >= doc2.updated_at_datetime ? -1 : 1
          );
      })
    );
  }
}
