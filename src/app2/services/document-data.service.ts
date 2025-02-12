import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as saveAs from 'file-saver';
import { DvDatePipe } from '../shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class DocumentDataService {
  pageUrl = '';
  headers = {};
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  getNotes(entityType, entityId) {
    return this.http.get(`notes`, {
      params: { entity_type: entityType, entity_id: entityId },
      headers: this.headers,
    });
  }

  createNote(params) {
    return this.http.post(`notes`, params, { headers: this.headers });
  }

  getDocument(id) {
    return this.http.get(`attachments/${id}`, { headers: this.headers });
  }

  setDocumentPageUrl(url) {
    this.pageUrl = url;
    this.headers = {
      'page-url': url,
    };
  }

  clearDocumentPageUrl() {
    this.pageUrl = '';
    this.headers = {};
  }

  getDocumentPageUrl() {
    return this.pageUrl;
  }

  getDocumentsAssignment(entity_type, entity_id) {
    return this.http.get('attachmentassignments', {
      params: {
        entity_type,
        entity_id,
      },
      headers: this.headers,
    });
  }

  getDocumentVersions(id) {
    return this.http.get(`attachmentversions`, {
      params: { attachment_id: id },
      headers: this.headers,
    });
  }

  getDocumentAssignments(id) {
    return this.http.get(`attachmentassignments`, {
      params: { attachment_id: id },
      headers: this.headers,
    });
  }

  getHTMLUrl(id) {
    return this.http.get(`attachments/${id}/html_url`);
  }

  getDocumentQueue() {
    return this.http.get('documents', { headers: this.headers });
  }

  getFirmRelationships(id) {
    return this.http.get('firm_relationships', {
      params: {
        entity_type: 'Firm',
        relationship_status_id: id,
      },
      headers: this.headers,
    });
  }

  postAttachmentAssignment(attachmentId, entityType, entityId, firmIds) {
    return this.http.post(
      `attachmentassignments`,
      {
        attachment_id: attachmentId,
        entity_type: entityType,
        entity_id: entityId,
        firm_ids: firmIds,
      },
      {
        headers: this.headers,
      }
    );
  }

  getSignedEmailAttachmentUrl(id) {
    return this.http.get(`attachments/${id}/signed_url`, {
      headers: this.headers,
    });
  }

  getAttachments(params) {
    return this.http.get('attachments', {
      params: params,
      headers: this.headers,
    });
  }

  assignBulkDocuments(params) {
    return this.http.post(`AttachmentAssignments/bulk_assignment_v2`, params);
  }

  getAttachmentReviews(attachment_id) {
    return this.http.get(`AttachmentReviews`, {
      params: { attachment_id },
      headers: this.headers,
    });
  }

  reviewAttachment(attachment_id) {
    return this.http.post(`AttachmentReviews`, { attachment_id });
  }

  getWorkflows(entityType, entityId) {
    return this.http.get('workflows', {
      params: {
        entity_type: entityType,
        entity_id: entityId,
      },
      headers: this.headers,
    });
  }

  revokeAttachmentAccess(id) {
    return this.http.delete(`AttachmentAssignments/${id}`, {
      headers: this.headers,
    });
  }

  getAttachmentAssignmentCount(entityType, id) {
    return this.http.get('AttachmentAssignments/count', {
      params: { entity_type: entityType, entity_id: id },
      headers: this.headers,
    });
  }

  getFunds(params: any) {
    return this.http.post('service/dvapi_service/product_search', params);
  }

  getDocuments(params) {
    return this.http.get(`attachments`, {
      params: params,
    });
  }

  updateDocumentTags(id: any, payload: any) {
    return this.http.put(`document_queue/${id}`, payload);
  }

  getSources() {
    return this.http.get(`document_sources`);
  }

  updateDocument(payload: any, options: any) {
    return this.http.post(`attachments`, payload, options);
  }

  updateDocumentQueue(id: any, payload: any) {
    return this.http.put(`document_queue/${id}`, payload);
  }

  createWorkflowAudits(payload: any) {
    return this.http.post(`workflow_audits`, payload);
  }

  updateAttachment(id: any, options: any) {
    return this.http.get(`attachments/${id}`, options);
  }

  updateDocumentV2(id, body, headers) {
    return this.http.put(`attachments/${id}`, body, { headers: headers });
  }

  createFolders(params) {
    return this.http.post('document_folders', params);
  }

  saveAttachmentWithFolder(params) {
    return this.http.post('attachments', params);
  }

  downloadAllDocuments(selectedRows, currentUser, columnApi) {
    let items_arr = [];
    const bulkDownloadArr: any = {
      user_id: currentUser.id,
      files: [],
      container_name: `firm${currentUser.firmInfo.id}`,
    };
    items_arr = selectedRows;

    // commented for now as don't know the purpose and grouping is not there for entity grid

    // const grouping_structure = documentsGrid.grouping.getGrouping();
    // if (
    //   grouping_structure.grouping.length > 0 &&
    //   grouping_structure.grouping[0].colName
    // ) {
    //   bulkDownloadArr.selected_group_name =
    //     grouping_structure.grouping[0].colName;
    // }
    if (columnApi?.getRowGroupColumns()?.length) {
      bulkDownloadArr.selected_group_name = columnApi
        .getRowGroupColumns()[0]
        .getColDef().field;
    }
    items_arr.forEach((item) => {
      const itemsObj: any = {};
      itemsObj.as_of_date = item.as_of_date;
      itemsObj.blob_name = item.blob_name;
      itemsObj.container_name = item.container_name;
      itemsObj.context = item.context;
      itemsObj.created_at = item.created_at;
      itemsObj.associated_Firm_Name = item.associated_Firm_Name;
      itemsObj.created_by = item.created_by;
      itemsObj.created_by_name = item.created_by_name;
      itemsObj.entity_id = item.entity_id;
      itemsObj.entity_type = item.entity_type;
      itemsObj.group_ids = item.group_ids;
      itemsObj.group_names = item.group_names;
      itemsObj.id = item.attachment_id || item.id;
      itemsObj.name = item.name;
      itemsObj.owner_firm_id = item.owner_firm_id;
      itemsObj.owner_firm_name = item.owner_firm_name;
      itemsObj.source = item.source;
      itemsObj.source_id = item.source_id;
      itemsObj.tag_names = item.tag_names;
      itemsObj.tags = item.tags;
      itemsObj.updated_at = item.updated_at;
      itemsObj.updated_by = item.updated_by;
      itemsObj.updated_by_name = item.updated_by_name;
      itemsObj.version = item.version ?? 0;
      itemsObj.associated_project_names = item.associated_project_names;
      itemsObj.associated_template_names = item.associated_template_names;
      itemsObj.associated_fund_names = item.associated_fund_names;
      itemsObj.associated_strategy_names = item.associated_strategy_names;
      itemsObj.associated_firm_names = item.associated_firm_names;
      itemsObj.associated_vehicle_names = item.associated_vehicle_names;
      (itemsObj.is_reviewed = item.reviews?.length > 0 ? 'Yes' : 'No'),
        (itemsObj.review_count = item.reviews?.length || '0'),
        (itemsObj.last_reviewed_date_str =
          item.reviews && item.reviews.length > 0
            ? this.dvDatePipe.transform(item.reviews[0].created_at)
            : ''),
        (itemsObj.last_reviewed_date =
          item.reviews && item.reviews.length > 0
            ? item.reviews[0].created_at
            : ''),
        (itemsObj.reviewed_by = item.reviews?.length
          ? item.reviews.map((x) => x.created_by_name)
          : []),
        bulkDownloadArr.files.push(itemsObj);
    });
    return this.http.post(
      '/service/dv_scheduler_service/download_dir_blob',
      bulkDownloadArr,
      {
        headers: this.headers,
      }
    );
  }

  getReceivedAttachmentsNewCount(
    startDate,
    endDate,
    entity_type = null,
    entity_id = null
  ) {
    return this.http.get(
      `v2/attachments/received_new_count?start_date=${startDate}&end_date=${endDate}&entity_type=${entity_type}&entity_id=${entity_id}`
    );
  }

  postDocumentStatisticsEvent(payload) {
    return this.http.post('document_statistics', payload, {
      headers: this.headers,
    });
  }

  downloadFile(file, name, fileName) {
    let downloadName = name;
    if (name && fileName && name != fileName) {
      let nameParts = name.split('.');
      let fileNameParts = fileName.split('.');
      if (
        fileNameParts.length > 1 &&
        !(
          nameParts.length > 1 &&
          nameParts[nameParts.length - 1] ==
            fileNameParts[fileNameParts.length - 1]
        )
      ) {
        downloadName = name + '.' + fileNameParts[fileNameParts.length - 1]; // add extension to the download file name if it isn't present in provided name
      }
    }
    saveAs(file, downloadName);
  }
}
