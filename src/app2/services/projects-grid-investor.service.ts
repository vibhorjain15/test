import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
  keywordConstants,
  numericSortWithNoValues,
} from '../shared/constants/constant';
import { CustomFieldsGridService } from './custom-fields-grid.service';
import { colDefMap } from '../shared/constants/project-grid-cols-data';

@Injectable({
  providedIn: 'root',
})
export class ProjectsGridInvestorService {
  keywordConstants = keywordConstants;

  private fetchCountsMethodCallSource = new Subject<any>();
  fetchCountsMethodCalled$ = this.fetchCountsMethodCallSource.asObservable();

  private stopActionButtonsLoadingSource = new Subject<any>();
  stopActionButtonsLoading$ =
    this.stopActionButtonsLoadingSource.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly customFieldsGridService: CustomFieldsGridService
  ) {}

  callFetchCountMethod() {
    this.fetchCountsMethodCallSource.next();
  }

  stopLoadingOfSentActions() {
    this.stopActionButtonsLoadingSource.next();
  }

  getProjectsGridColDef(type: string, customFields = []): ColDef[] {
    const colDef: ColDef[] = [];
    const gridTabCols = {
      'my projects': [
        'selectAll',
        'entity_name',
        'name',
        'template_name',
        'due_at',
        'as_of_date',
        'displayStatus',
        'internal_key',
        'displayType',
        'primary_owners',
        'started_by',
        'entity_type',
        'question_count',
        'total_score',
        'total_flags',
        'percentage_completed',
        'last_updated_at',
        'last_reminded_at',
        'last_reminded_by_name',
      ],
      'in-progress': [
        'selectAll',
        'entity_name',
        'name',
        'template_name',
        'due_at',
        'as_of_date',
        'internal_key',
        'displayStatus',
        'displayType',
        'primary_owners',
        'started_by',
        'entity_type',
        'question_count',
        'total_score',
        'total_flags',
        'percentage_completed',
        'last_updated_at',
        'last_reminded_at',
        'last_reminded_by_name',
      ],
      closed: [
        'selectAll',
        'entity_name',
        'name',
        'template_name',
        'as_of_date',
        'displayStatus',
        'internal_key',
        'displayType',
        'primary_owners',
        'started_by',
        'entity_type',
        'last_updated_at',
        'closed_at',
        'question_count',
        'total_score',
        'total_flags',
      ],
      sent: [
        'selectAll',
        'entity_name',
        'name',
        'due_at',
        'as_of_date',
        'tofirm_name',
        'internal_key',
        'template_name',
        'primary_owners',
        'started_by',
        'entity_type',
        'created_at',
        'created_by_name',
        'question_count',
        'last_reminded_at',
        'last_reminded_by_name',
      ],
      all: [
        'selectAll',
        'entity_name',
        'name',
        'tofirm_name',
        'template_name',
        'created_at',
        'created_by_name',
        'internal_key',
        'due_at',
        'as_of_date',
        'displayStatus',
        'displayType',
        'primary_owners',
        'started_by',
        'entity_type',
        'question_count',
        'total_score',
        'total_flags',
        'percentage_completed',
        'last_updated_at',
        'last_reminded_at',
        'last_reminded_by_name',
      ],
    };
    gridTabCols[type].forEach((column) => {
      colDef.push(colDefMap[column]);
    });

    if (customFields?.length) {
      this.customFieldsGridService.addColumnsForCustomFields(
        colDef,
        customFields
      );
    }

    return colDef;
  }

  getProjectsGridData(payload: any): Observable<any> {
    return this.http
      .post(`service/dvapi_service/diligence_search`, payload)
      .pipe(
        map((response: any) => {
          return response.data;
        })
      );
  }

  generatePageUrl(entity: any) {
    let pageUrl = '';
    if (
      entity.entity_type.toLowerCase() ===
      this.keywordConstants.Product.toLowerCase()
    ) {
      pageUrl += `app/diligence/${entity.fromfirm_id}/firms/${entity.tofirm_id}/funds/${entity.entity_id}/projects/${entity.id}`;
    } else if (
      entity.entity_type.toLowerCase() ===
      this.keywordConstants.Firm.toLowerCase()
    ) {
      pageUrl += `app/diligence/${entity.fromfirm_id}/firms/${entity.entity_id}/projects/${entity.id}`;
    }
    return pageUrl;
  }

  getDiligenceCounts(params) {
    return this.http.get('diligences/counts', { params: params });
  }

  getSearchFilters(params) {
    return this.http.post('service/dvapi_service/search_filters', params);
  }

  updateStatus(id, payload, headers = null) {
    if (!headers) {
      headers = new HttpHeaders();
    }
    headers = headers.set('diligence-status', payload.status.toLowerCase());
    return this.http.put(`diligences/${id}`, payload, { headers: headers });
  }

  bulkScheduleDiligences(payload) {
    return this.http.put('diligences/bulk_schedule_diligences', payload);
  }

  bulkActions(payload, headers) {
    headers = headers.set('diligence-status', payload.status.toLowerCase());
    return this.http.put('v2/diligences/bulk_actions', payload, {
      headers: headers,
    });
  }

  exportProjects(params) {
    return this.http.post('service/excel_services/bulk_word_export', params);
  }
}
