import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { PopupCheckerService } from 'src/app2/services/popup-checker.service';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { forkJoin } from 'rxjs';
import { GridFolderManagementService } from 'src/app2/services/grid-folder-management.service';
import * as saveAs from 'file-saver';
import { DvDatePipe } from '../shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class DocumentsService {
  dateFormat: string = 'MM-DD-YYYYTHH:mm:ss';
  originalDocuments: any = [];
  documents: any = [];
  documentTypes: any = [];
  documentGroups: any = [];
  allFirmsList: any = [];
  allFundsList: any = [];
  filterParams: any = {};
  fitleredResults: any = [];
  documentPageUrl = '';
  constructor(
    private readonly http: HttpClient,
    private readonly datePipe: DatePipe,
    private readonly toaster: ToastrService,
    private readonly popCheckerService: PopupCheckerService,
    private readonly dvDatePipe: DvDatePipe,
    private readonly gridFolderService: GridFolderManagementService
  ) {}

  setDocuments(documents: any) {
    this.documents = documents;
  }

  setOriginalDocuments(documents: any) {
    this.originalDocuments = JSON.parse(JSON.stringify(documents));
  }

  filterDocuments(
    params: any,
    filterByOwnerFirm = false,
    currentFirmId = null
  ) {
    this.setFilterParams(params);
    return this.performFiltering(filterByOwnerFirm, currentFirmId);
  }

  setFilterParams(params: any) {
    this.filterParams = params;
  }

  getFilteredResults() {
    return this.fitleredResults;
  }

  getOriginalDocuments() {
    return this.originalDocuments;
  }

  getEntityAttachments(params) {
    return this.http.get('attachmentassignments', { params });
  }

  getAllAttachments(params) {
    return this.http.get('attachments', { params });
  }

  // Reset Documents to original documents
  resetToOriginalDocuments() {
    const originalDocuments = JSON.parse(
      JSON.stringify(this.getOriginalDocuments())
    );
    this.setDocuments(originalDocuments);
  }

  performFiltering(filterByOwnerFirm = false, currentFirmId = null) {
    if (
      this.filterParams &&
      this.filterParams.global_operator === 'or' &&
      Object.keys(this.filterParams)?.filter((key) => key != 'global_operator')
        ?.length > 0
    ) {
      return this.performOrBasedFiltering(filterByOwnerFirm, currentFirmId);
    } else if (
      this.filterParams &&
      this.filterParams.isFilterApplied !== false &&
      Object.keys(this.filterParams)?.filter((key) => key != 'global_operator')
        ?.length > 0
    ) {
      return this.performAndBasedFiltering(filterByOwnerFirm, currentFirmId);
    } else {
      return this.originalDocuments;
    }
  }

  performAndBasedFiltering(filterByOwnerFirm = false, currentFirmId = null) {
    let foldersMap = {};
    this.fitleredResults = [];
    this.originalDocuments.forEach((document) => {
      if (document.type === 0) {
        foldersMap[document.attachmentHierarchyId] = {
          document,
          isAdded: false,
        };
      }
    });
    this.originalDocuments.forEach((document) => {
      if (
        document.type &&
        !this.getConditionMatchResults(
          document,
          filterByOwnerFirm,
          currentFirmId,
          'and'
        ).some((isMatched) => !isMatched)
      ) {
        this.fitleredResults.push(document);
        document.path?.forEach((folderId) => {
          if (folderId in foldersMap && !foldersMap[folderId].isAdded) {
            this.fitleredResults.push(foldersMap[folderId].document);
            foldersMap[folderId].isAdded = true;
          }
        });
      } else if (
        document.type === 0 &&
        !this.filterParams.isFilterApplied &&
        !foldersMap[document.attachmentHierarchyId].isAdded
      ) {
        this.fitleredResults.push(document);
        foldersMap[document.attachmentHierarchyId].isAdded = true;
      }
    });

    return this.fitleredResults;
  }

  performOrBasedFiltering(filterByOwnerFirm = false, currentFirmId = null) {
    let foldersMap = {};
    this.fitleredResults = [];
    this.originalDocuments.forEach((document) => {
      if (document.type === 0) {
        foldersMap[document.attachmentHierarchyId] = {
          document,
          isAdded: false,
        };
      }
    });
    this.originalDocuments.forEach((document) => {
      if (
        document.type &&
        this.getConditionMatchResults(
          document,
          filterByOwnerFirm,
          currentFirmId,
          'or'
        ).some((isMatched) => isMatched == true)
      ) {
        this.fitleredResults.push(document);
        document.path?.forEach((folderId) => {
          if (folderId in foldersMap && !foldersMap[folderId].isAdded) {
            this.fitleredResults.push(foldersMap[folderId].document);
            foldersMap[folderId].isAdded = true;
          }
        });
      } else if (
        document.type === 0 &&
        !this.filterParams.isFilterApplied &&
        !foldersMap[document.attachmentHierarchyId].isAdded
      ) {
        this.fitleredResults.push(document);
        foldersMap[document.attachmentHierarchyId].isAdded = true;
      }
    });

    return this.fitleredResults;
  }

  getDocumentsAndNonEmptyFolders(documents) {
    let filteredResults = [];
    let foldersMap = {};
    documents.forEach((document) => {
      if (document.type === 0) {
        foldersMap[document.attachmentHierarchyId] = {
          document,
          isAdded: false,
        };
      }
    });

    documents.forEach((document) => {
      if (document.type) {
        filteredResults.push(document);
        document.path?.forEach((folderId) => {
          if (folderId in foldersMap && !foldersMap[folderId].isAdded) {
            filteredResults.push(foldersMap[folderId].document);
            foldersMap[folderId].isAdded = true;
          }
        });
      }
    });

    this.sortDocumentsAndFolders(filteredResults);

    return filteredResults;
  }

  getConditionMatchResults(
    document,
    filterByOwnerFirm,
    currentFirmId,
    filterType: 'or' | 'and'
  ) {
    let [
      groupSearch,
      typeSearch,
      firmSearch,
      strategySearch,
      fundSearch,
      vehicleSearch,
      beforeDateSearch,
      afterDateSearch,
      equalDateSearch,
      beforeCreatedAtDateSearch,
      afterCreatedAtDateSearch,
      equalCreatedAtDateSearch,
      createdBySearch,
      diligenceSearch,
      equalReceivedAtDateSearch,
      beforeReceivedAtDateSearch,
      afterReceivedAtDateSearch,
      sharedWithFirmSearch,
      sharedBySearch,
    ] = Array.from([
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
      filterType == 'and' ? true : false,
    ]);

    if (this.filterParams.hasOwnProperty('group_ids')) {
      groupSearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'group_ids'
      );
    }

    if (this.filterParams.hasOwnProperty('type_ids')) {
      typeSearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'type_ids'
      );
    }

    if (this.filterParams.hasOwnProperty('firm_ids')) {
      firmSearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'firm_ids'
      );
    }

    if (this.filterParams.hasOwnProperty('strategy_ids')) {
      strategySearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'strategy_ids'
      );
    }

    if (this.filterParams.hasOwnProperty('fund_ids')) {
      fundSearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'fund_ids'
      );
    }

    if (this.filterParams.hasOwnProperty('vehicle_ids')) {
      vehicleSearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'vehicle_ids'
      );
    }

    if (this.filterParams.hasOwnProperty('eq_as_of_date')) {
      this.filterParams.eq_as_of_date.forEach((asOfDate) => {
        let isMatched = moment(document.as_of_date).isSame(
          moment(asOfDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          equalDateSearch = equalDateSearch && isMatched;
        } else {
          equalDateSearch = equalDateSearch || isMatched;
        }
      });
    }

    if (this.filterParams.hasOwnProperty('gt_as_of_date')) {
      this.filterParams.gt_as_of_date.forEach((asOfDate) => {
        let isMatched = moment(document.as_of_date).isSameOrAfter(
          moment(asOfDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          afterDateSearch = afterDateSearch && isMatched;
        } else {
          afterDateSearch = afterDateSearch || isMatched;
        }
      });
    }

    if (this.filterParams.hasOwnProperty('lt_as_of_date')) {
      this.filterParams.lt_as_of_date.forEach((asOfDate) => {
        let isMatched = moment(document.as_of_date).isSameOrBefore(
          moment(asOfDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          beforeDateSearch = beforeDateSearch && isMatched;
        } else {
          beforeDateSearch = beforeDateSearch || isMatched;
        }
      });
    }

    if (this.filterParams.hasOwnProperty('eq_created_at_date')) {
      this.filterParams.eq_created_at_date.forEach((createdAtDate) => {
        let isMatched = moment(document.document.created_at).isSame(
          moment(createdAtDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          equalCreatedAtDateSearch = equalCreatedAtDateSearch && isMatched;
        } else {
          equalCreatedAtDateSearch = equalCreatedAtDateSearch || isMatched;
        }
      });
      equalCreatedAtDateSearch =
        equalCreatedAtDateSearch &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id == currentFirmId);
    }

    if (this.filterParams.hasOwnProperty('gt_created_at_date')) {
      this.filterParams.gt_created_at_date.forEach((createdAtDate) => {
        let isMatched = moment(document.document.created_at).isSameOrAfter(
          moment(createdAtDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          afterCreatedAtDateSearch = afterCreatedAtDateSearch && isMatched;
        } else {
          afterCreatedAtDateSearch = afterCreatedAtDateSearch || isMatched;
        }
      });
      afterCreatedAtDateSearch =
        afterCreatedAtDateSearch &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id == currentFirmId);
    }

    if (this.filterParams.hasOwnProperty('lt_created_at_date')) {
      this.filterParams.lt_created_at_date.forEach((createdAtDate) => {
        let isMatched = moment(document.document.created_at).isSameOrBefore(
          moment(createdAtDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          beforeCreatedAtDateSearch = beforeCreatedAtDateSearch && isMatched;
        } else {
          beforeCreatedAtDateSearch = beforeCreatedAtDateSearch || isMatched;
        }
      });
      beforeCreatedAtDateSearch =
        beforeCreatedAtDateSearch &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id == currentFirmId);
    }

    if (this.filterParams.hasOwnProperty('created_by')) {
      createdBySearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'created_by'
      );
    }

    if (this.filterParams.hasOwnProperty('diligence_ids')) {
      diligenceSearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'diligence_ids'
      );
    }

    if (this.filterParams.hasOwnProperty('eq_received_at_date')) {
      this.filterParams.eq_received_at_date.forEach((receivedAtDate) => {
        let isMatched = moment(document.received_at).isSame(
          moment(receivedAtDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          equalReceivedAtDateSearch = equalReceivedAtDateSearch && isMatched;
        } else {
          equalReceivedAtDateSearch = equalReceivedAtDateSearch || isMatched;
        }
      });
      equalReceivedAtDateSearch =
        equalReceivedAtDateSearch &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id !== currentFirmId);
    }

    if (this.filterParams.hasOwnProperty('gt_received_at_date')) {
      this.filterParams.gt_received_at_date.forEach((receivedAtDate) => {
        let isMatched = moment(document.received_at).isSameOrAfter(
          moment(receivedAtDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          afterReceivedAtDateSearch = afterReceivedAtDateSearch && isMatched;
        } else {
          afterReceivedAtDateSearch = afterReceivedAtDateSearch || isMatched;
        }
      });
      afterReceivedAtDateSearch =
        afterReceivedAtDateSearch &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id !== currentFirmId);
    }

    if (this.filterParams.hasOwnProperty('lt_received_at_date')) {
      this.filterParams.lt_received_at_date.forEach((receivedAtDate) => {
        let isMatched = moment(document.received_at).isSameOrBefore(
          moment(receivedAtDate, this.dateFormat),
          'day'
        );
        if (filterType == 'and') {
          beforeReceivedAtDateSearch = beforeReceivedAtDateSearch && isMatched;
        } else {
          beforeReceivedAtDateSearch = beforeReceivedAtDateSearch || isMatched;
        }
      });
      beforeReceivedAtDateSearch =
        beforeReceivedAtDateSearch &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id !== currentFirmId);
    }

    if (this.filterParams.hasOwnProperty('shared_with_firms')) {
      sharedWithFirmSearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'shared_with_firms'
      );
    }

    if (this.filterParams.hasOwnProperty('shared_by')) {
      sharedBySearch = this.isSpecificConditionMatched(
        document,
        filterType,
        'shared_by'
      );
    }

    return [
      groupSearch,
      typeSearch,
      firmSearch,
      strategySearch,
      fundSearch,
      vehicleSearch,
      beforeDateSearch,
      afterDateSearch,
      equalDateSearch,
      beforeCreatedAtDateSearch,
      afterCreatedAtDateSearch,
      equalCreatedAtDateSearch,
      createdBySearch,
      diligenceSearch,
      equalReceivedAtDateSearch,
      beforeReceivedAtDateSearch,
      afterReceivedAtDateSearch,
      sharedWithFirmSearch,
      sharedBySearch,
    ];
  }

  isSpecificConditionMatched(document, filterType: 'or' | 'and', propName) {
    let isMatched = filterType == 'and' ? true : false;
    this.filterParams[propName].forEach((values) => {
      let res = false;
      switch (propName) {
        case 'group_ids':
          if (!document.hasOwnProperty('group_ids')) {
            res = values.includes((value) => value === document.group_id);
          } else {
            res = document.group_ids.some((value) => values.includes(value));
          }
          break;
        case 'type_ids':
          res = document.document.tags.some((value) => values.includes(value));
          break;
        case 'firm_ids':
          res = document.document.associated_firms.some((value) =>
            values.includes(value)
          );
          break;
        case 'strategy_ids':
          res = document.document.associated_strategies.some((value) =>
            values.includes(value)
          );
          break;
        case 'fund_ids':
          res = document.document.associated_funds.some((value) =>
            values.includes(value)
          );
          break;
        case 'vehicle_ids':
          res = document.document.associated_vehicles.some((value) =>
            values.includes(value)
          );
          break;
        case 'created_by':
          res = values.includes(document.document.created_by);
          break;
        case 'diligence_ids':
          res = values.some((diligenceId) =>
            document.document.associated_duediligences.includes(diligenceId)
          );
          break;
        case 'shared_with_firms':
          res = values?.some((firm) =>
            document?.document?.shared_with_firm_ids.includes(firm.id)
          );
          break;
        case 'shared_by':
          res = values?.some((id) => document?.document?.shared_by == id);
          break;
      }
      if (filterType == 'and') {
        isMatched = isMatched && res;
      } else {
        isMatched = isMatched || res;
      }
    });
    return isMatched;
  }

  isOrConditionMatched(document, filterByOwnerFirm, currentFirmId) {
    if (this.filterParams.hasOwnProperty('group_ids')) {
      if (document.hasOwnProperty('group_ids')) {
        if (
          this.filterParams.group_ids.filter(
            (value) => value === document.group_id
          ).length > 0
        ) {
          return true;
        }
      } else {
        if (
          document.group_ids.filter((value) =>
            this.filterParams.group_ids.includes(value)
          ).length > 0
        ) {
          return true;
        }
      }
    }

    if (this.filterParams.hasOwnProperty('type_ids')) {
      if (
        document.document.tags.filter((value) =>
          this.filterParams.type_ids.includes(value)
        ).length > 0
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('firm_ids')) {
      if (
        document.document.associated_firms.filter((value) =>
          this.filterParams.firm_ids.includes(value)
        ).length > 0
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('strategy_ids')) {
      if (
        document.document.associated_strategies.filter((value) =>
          this.filterParams.strategy_ids.includes(value)
        ).length > 0
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('fund_ids')) {
      if (
        document.document.associated_funds.filter((value) =>
          this.filterParams.fund_ids.includes(value)
        ).length > 0
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('vehicle_ids')) {
      if (
        document.document.associated_vehicles.filter((value) =>
          this.filterParams.vehicle_ids.includes(value)
        ).length > 0
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('eq_as_of_date')) {
      if (
        moment(document.as_of_date).isSame(
          moment(this.filterParams.eq_as_of_date, this.dateFormat),
          'day'
        )
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('gt_as_of_date')) {
      if (
        moment(document.as_of_date).isSameOrAfter(
          moment(this.filterParams.gt_as_of_date, this.dateFormat),
          'day'
        )
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('lt_as_of_date')) {
      if (
        moment(document.as_of_date).isSameOrBefore(
          moment(this.filterParams.lt_as_of_date, this.dateFormat),
          'day'
        )
      ) {
        return true;
      }
    }

    if (
      Object.keys(this.filterParams).filter((value) =>
        ['global_operator', 'q'].includes(value)
      ).length === 2
    ) {
      return true;
    }

    if (
      this.filterParams.hasOwnProperty('eq_created_at_date') &&
      moment(document?.document?.created_at).isSame(
        moment(this.filterParams.eq_created_at_date, this.dateFormat),
        'day'
      )
    ) {
      return true;
    } else if (
      this.filterParams.hasOwnProperty('gt_created_at_date') &&
      moment(document?.document?.created_at).isSameOrAfter(
        moment(this.filterParams.gt_created_at_date, this.dateFormat),
        'day'
      )
    ) {
      return true;
    } else if (
      this.filterParams.hasOwnProperty('lt_created_at_date') &&
      moment(document?.document?.created_at).isSameOrBefore(
        moment(this.filterParams.lt_created_at_date, this.dateFormat),
        'day'
      )
    ) {
      return true;
    }

    if (
      this.filterParams.hasOwnProperty('created_by') &&
      this.filterParams.created_by?.includes(document?.document?.created_by)
    ) {
      return true;
    }

    if (
      this.filterParams.hasOwnProperty('diligence_ids') &&
      this.filterParams.diligence_ids?.some((diligenceId) =>
        document?.document?.associated_duediligences.includes(diligenceId)
      )
    ) {
      return true;
    }

    if (this.filterParams.hasOwnProperty('eq_received_at_date')) {
      if (
        moment(document.received_at).isSame(
          moment(this.filterParams.eq_received_at_date, this.dateFormat),
          'day'
        ) &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id !== currentFirmId)
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('gt_received_at_date')) {
      if (
        moment(document.received_at).isSameOrAfter(
          moment(this.filterParams.gt_received_at_date, this.dateFormat),
          'day'
        ) &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id !== currentFirmId)
      ) {
        return true;
      }
    }

    if (this.filterParams.hasOwnProperty('lt_received_at_date')) {
      if (
        moment(document.received_at).isSameOrBefore(
          moment(this.filterParams.lt_received_at_date, this.dateFormat),
          'day'
        ) &&
        (!filterByOwnerFirm ||
          !currentFirmId ||
          document.owner_firm_id !== currentFirmId)
      ) {
        return true;
      }
    }

    if (
      this.filterParams.hasOwnProperty('shared_with_firms') &&
      this.filterParams.shared_with_firms?.some((firm) =>
        document?.document?.shared_with_firm_ids.includes(firm.id)
      )
    ) {
      return true;
    }

    return false;
  }

  isDateConditionMatched(date1, date2, condition: 'gt' | 'lt' | 'eq') {
    switch (condition) {
      case 'gt':
        return moment(date1).isSameOrAfter(
          moment(date2, this.dateFormat),
          'day'
        );
      case 'lt':
        return moment(date1).isSameOrBefore(
          moment(date2, this.dateFormat),
          'day'
        );
      case 'eq':
        return moment(date1).isSame(moment(date2, this.dateFormat), 'day');
    }
  }

  getDocumentsRowData(
    params,
    selectedTab,
    currentFirmId,
    viewType,
    gridType,
    entityId = null,
    entityType = null,
    dateFormat = this.dvDatePipe.defaultDateFormat
  ) {
    const endPoint = params.q
      ? 'attachments/search'
      : gridType === 'content'
      ? 'attachments'
      : 'attachmentassignments';
    let requests = [this.http.get(endPoint, { params })];
    let type = null;
    switch (selectedTab) {
      case 'MyAttachments':
        type = 1;
        break;
      case 'Received':
        type = 2;
        break;
      case 'All':
        type = null;
        break;
    }

    requests.push(
      this.gridFolderService.getAttachmentHierarchy(
        0,
        type,
        entityId,
        entityType,
        params?.start_date,
        params?.end_date
      )
    );
    return forkJoin(requests).pipe(
      map((result: any) => {
        let attachments,
          attachmentHierarchy = [];
        [attachments, attachmentHierarchy] = result;

        if (gridType === 'content') {
          attachments.map((document) => {
            document.associated_all_entities = [];
            const addEntity = (entity: string = '') => {
              if (entity?.length > 0) {
                document.associated_all_entities.push(entity);
              }
            };
            const filterEntity = (entity) => entity?.length > 0;
            document.associated_fund_names.map(addEntity);
            document.associated_firm_names.map(addEntity);
            document.associated_strategy_names.map(addEntity);
            document.associated_vehicle_names.map(addEntity);
            document.associated_all_entities =
              document.associated_all_entities.filter(filterEntity);
            document.associated_project_names =
              document.associated_project_names.filter(filterEntity);
            document.associated_fund_names =
              document.associated_fund_names.filter(filterEntity);
            document.associated_firm_names =
              document.associated_firm_names.filter(filterEntity);
            document.associated_strategy_names =
              document.associated_strategy_names.filter(filterEntity);
            document.associated_vehicle_names =
              document.associated_vehicle_names.filter(filterEntity);
          });
        }

        let baseAttachmentHierarchyId;
        [attachments, baseAttachmentHierarchyId] =
          this.gridFolderService.prepareAttachmentHierarchyV2(
            attachmentHierarchy,
            attachments,
            gridType
          );

        if (viewType == 1) {
          attachments = attachments?.filter(
            (attachment) => attachment.type === 1
          );
        }
        let resultDocuments = this.getMappedDocumentArray(
          attachments,
          dateFormat,
          selectedTab,
          gridType,
          currentFirmId
        );
        this.sortDocumentsAndFolders(resultDocuments);
        return {
          attachments: resultDocuments,
          baseAttachmentHierarchyId,
        };
      })
    );
  }

  sortDocumentsAndFolders(arr) {
    arr.sort((doc1, doc2) => {
      if (doc1.updated_at_datetime > doc2.updated_at_datetime) return -1;
      else if (doc1.updated_at_datetime < doc2.updated_at_datetime) return 1;
      else if (
        doc1.type === 0 &&
        doc2.type === 0 &&
        doc1.bulk_organize_id &&
        doc2.bulk_organize_id
      ) {
        let doc1Keys = doc1.bulk_organize_id.split('|');
        let doc2Keys = doc2.bulk_organize_id.split('|');
        if (doc1Keys.length == doc2Keys.length && doc1Keys.length > 1) {
          let doc1KeyValuePair = doc1Keys[doc1Keys.length - 1];
          let doc1Key =
            doc1KeyValuePair?.split(':')?.length == 2
              ? doc1KeyValuePair.split(':')[0]
              : null;
          let doc1Value =
            doc1KeyValuePair?.split(':')?.length == 2
              ? doc1KeyValuePair.split(':')[1]
              : null;

          let doc2KeyValuePair = doc2Keys[doc2Keys.length - 1];
          let doc2Key =
            doc2KeyValuePair?.split(':')?.length == 2
              ? doc2KeyValuePair.split(':')[0]
              : null;
          let doc2Value =
            doc2KeyValuePair?.split(':')?.length == 2
              ? doc2KeyValuePair.split(':')[1]
              : null;

          if (doc1Key && doc2Key && doc1Key == doc2Key) {
            switch (doc1Key) {
              case 'as_of_date':
                if (
                  moment(doc1Value, 'YYYY-MM-DD', true).isValid() &&
                  moment(doc2Value, 'YYYY-MM-DD', true).isValid()
                ) {
                  return moment(doc1Value, 'YYYY-MM-DD').isBefore(
                    moment(doc2Value, 'YYYY-MM-DD')
                  )
                    ? -1
                    : 1;
                }
                return -1;
              case 'as_of_date_year':
                if (
                  doc1Value &&
                  doc2Value &&
                  !isNaN(doc1Value) &&
                  !isNaN(doc2Value)
                ) {
                  return Number(doc1Value) > Number(doc2Value) ? -1 : 1;
                }
                return -1;
              case 'as_of_date_month':
                if (
                  moment(doc1Value, 'YYYYM', true).isValid() &&
                  moment(doc2Value, 'YYYYM', true).isValid()
                ) {
                  return moment(doc1Value, 'YYYYM').isAfter(
                    moment(doc2Value, 'YYYYM')
                  )
                    ? 1
                    : -1;
                }
                return -1;
            }
          }

          return doc1.name?.toString()?.localeCompare(doc2.name?.toString());
        }
      } else {
        return doc1.name?.toString()?.localeCompare(doc2.name?.toString());
      }
    });
  }

  getMappedDocumentArray(
    attachments,
    dateFormat,
    selectedTab,
    gridType,
    currentFirmId
  ) {
    return (attachments as any[]).map((document) => ({
      ...document,
      id: document.id,
      action: '',
      associated_all_entities: document?.associated_all_entities || '',
      document_name: document.name || '',
      owner_firm_name: document.owner_firm_name || '',
      project_name: document.associated_project_names || '',
      template_name: document.associated_template_names || '',
      document_types: document?.tag_names,
      file_name: document.file_name || '',
      as_of_date: this.dvDatePipe.transform(document?.as_of_date, [
        dateFormat,
        'isLocaleDate',
      ]),
      created_at:
        document.type === 0
          ? ''
          : this.dvDatePipe.transform(document.created_at, [dateFormat]),
      updated_at: document.updated_at
        ? this.dvDatePipe.transform(document.updated_at, [dateFormat])
        : this.dvDatePipe.transform(document.created_at, [dateFormat]),
      updated_at_datetime: document.updated_at
        ? new Date(document.updated_at)
        : selectedTab == 'Received' && document.received_at
        ? new Date(document.received_at)
        : new Date(document.created_at),
      updated_by: document.updated_by_name?.trim()?.length
        ? document.updated_by_name
        : document.created_by_name,
      uploaded_by: document.created_by_name || '',
      group_names: document.group_names || '',
      views: document.view_count || 0,
      document,
      review: document.reviews || '',
      name: document.name,
      is_reviewed: document.type
        ? document.reviews?.length > 0
          ? 'Yes'
          : 'No'
        : '',
      review_count:
        document.reviews?.length > 0
          ? document.reviews?.length
          : document.type
          ? '0'
          : '',
      last_reviewed_date_str:
        document.reviews && document.reviews.length > 0
          ? this.dvDatePipe.transform(document.reviews[0].created_at)
          : '',
      last_reviewed_date:
        document.reviews && document.reviews.length > 0
          ? document.reviews[0].created_at
          : '',
      reviewed_by: document.reviews?.length
        ? document.reviews.map((x) => x.created_by_name)
        : [],
      received_at: this.dvDatePipe.transform(
        gridType == 'entity' ? document.created_at : document.received_at,
        [dateFormat]
      ),
      shared_by: document.shared_by_name,
      uploaded_shared_by:
        document.owner_firm_id == currentFirmId
          ? document.created_by_name
          : document.shared_by_name,
      shared_with_firm_names: document.shared_with_firm_names,
      shared_with_firm_ids: document.shared_with_firm_ids,
      shared_firm_count:
        document.shared_with_firm_ids?.length > 0
          ? document.shared_with_firm_ids?.length
          : document.type
          ? '0'
          : '',
      is_unread: document.is_unread,
      version: document.version ?? 0,
      bulk_organize_id: document.bulk_organize_id,
    }));
  }

  getDocumentColDef(
    isInvestor,
    tab = 'MyAttachments',
    gridType: 'content' | 'entity',
    viewType: 'file' | 'folder'
  ): ColDef[] {
    const colDef: ColDef[] = [];
    let cellStyle = (params) => {
      return viewType == 'folder'
        ? {
            paddingLeft: '0px',
          }
        : {};
    };
    colDef.push({
      ...defaultColumn,
      colId: 'document_types',
      headerName: 'Document Types',
      field: 'document_types',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
      floatingFilterComponentParams: {
        placeHolder: 'Search by Document Types',
      },
      minWidth: grid_widths_map['sm_column_sm'],
      cellRenderer:
        // 'agGroupCellRenderer',
        viewType == 'file'
          ? 'agGroupCellRenderer'
          : 'groupableFieldNameCellRenderer',
      cellRendererParams: {
        innerRenderer:
          viewType == 'file' ? 'groupableFieldNameCellRenderer' : null,
      },
      cellClass:
        'my-permission-cursor-pointer' +
        (viewType == 'folder' ? ' hide-expand-icon' : ''),
      refData: { showGroupMenu: 'true' },
    });
    if (gridType === 'content')
      colDef.push({
        ...defaultColumn,
        colId: 'associated_all_entities',
        headerName: 'Associated Entities',
        field: 'associated_all_entities',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Name',
        },
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'my-permission-cursor-pointer',
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        cellRenderer:
          viewType == 'file'
            ? 'agGroupCellRenderer'
            : 'groupableFieldNameCellRenderer',
        cellRendererParams: {
          innerRenderer:
            viewType == 'file' ? 'groupableFieldNameCellRenderer' : null,
          type: 'entities',
        },
      });
    colDef.push({
      ...defaultColumn,
      colId: 'as_of_date',
      headerName: 'As of Date',
      field: 'as_of_date',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search by Date',
      },
      minWidth: grid_widths_map['sm_column_xm'],
      menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
      comparator: dateSortNew('as_of_date'),
    });
    if (tab != 'MyAttachments') {
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
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'clickable',
      });
    }
    if (tab == 'MyAttachments') {
      colDef.push({
        ...defaultColumn,
        colId: 'created_at',
        headerName: 'Uploaded On',
        field: 'created_at',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Date',
        },
        minWidth: grid_widths_map['sm_column_xm'],
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        comparator: dateSortNew('created_at'),
      });
      colDef.push({
        ...defaultColumn,
        colId: 'uploaded_by',
        headerName: 'Uploaded By',
        field: 'uploaded_by',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Uploader',
        },
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        minWidth: grid_widths_map['sm_column_sm'],
        hide: true,
      });
    } else if (tab == 'Received') {
      colDef.push({
        ...defaultColumn,
        colId: 'received_at',
        headerName: 'Received On',
        field: 'received_at',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Date',
        },
        minWidth: grid_widths_map['sm_column_xm'],
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        comparator: dateSortNew('received_at'),
      });
      colDef.push({
        ...defaultColumn,
        colId: 'shared_by',
        headerName: 'Shared By',
        field: 'shared_by',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Shared By',
        },
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'clickable',
        hide: true,
      });
    }

    if (tab == 'All') {
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
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        comparator: dateSortNew('created_at'),
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
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'clickable',
        hide: true,
      });
    }

    colDef.push({
      ...defaultColumn,
      colId: 'views',
      headerName: 'Views',
      field: 'views',
      minWidth: grid_widths_map['sm_column_sm'],
      cellRenderer: (params) => {
        if (params.data?.document.type) return params.data.document.view_count;
        else return null;
      },
      hide: true,
    });

    if (tab == 'MyAttachments') {
      colDef.push({
        ...defaultColumn,
        colId: 'shared_firm_count',
        headerName: '# of Recipient Firms',
        field: 'shared_firm_count',
        filter: 'agTextColumnFilter',
        hide: true,
        floatingFilter: false,
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'my-permission-cursor-pointer',
        cellRenderer: 'NumericCellRenderer',
      });
      colDef.push({
        ...defaultColumn,
        colId: 'shared_with_firm_names',
        headerName: 'Shared With',
        field: 'shared_with_firm_names',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Shared With',
        },
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'clickable',
        hide: true,
        cellRenderer:
          viewType == 'file'
            ? 'agGroupCellRenderer'
            : 'groupableFieldNameCellRenderer',
        cellRendererParams: {
          innerRenderer:
            viewType == 'file' ? 'groupableFieldNameCellRenderer' : null,
          type: 'entities',
        },
      });
    }

    if (gridType == 'content') {
      colDef.push({
        ...defaultColumn,
        colId: 'project_name',
        headerName: isInvestor ? 'Project Name' : 'Client Name',
        field: 'project_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder:
            'Search by ' + (isInvestor ? 'Project Name' : 'Client Name'),
        },
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        minWidth: grid_widths_map['sm_column_xxl'],
        hide: true,
        cellRenderer:
          viewType == 'file'
            ? 'agGroupCellRenderer'
            : 'groupableFieldNameCellRenderer',
        cellRendererParams: {
          innerRenderer:
            viewType == 'file' ? 'groupableFieldNameCellRenderer' : null,
          type: 'entities',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'template_name',
        headerName: 'Template Name',
        field: 'template_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Template Name',
        },
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        minWidth: grid_widths_map['sm_column_xxl'],
        hide: true,
        cellRenderer:
          viewType == 'file'
            ? 'agGroupCellRenderer'
            : 'groupableFieldNameCellRenderer',
        cellRendererParams: {
          innerRenderer:
            viewType == 'file' ? 'groupableFieldNameCellRenderer' : null,
          type: 'entities',
        },
      });
    }
    colDef.push({
      ...defaultColumn,
      colId: 'file_name',
      headerName: 'File Name',
      field: 'file_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search by File Name',
      },
      minWidth: grid_widths_map['sm_column_sm'],
      hide: gridType === 'content',
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
      menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
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
      menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
      minWidth: grid_widths_map['sm_column_xm'],
      cellClass: 'clickable',
      comparator: dateSortNew('updated_at_datetime'),
    });

    if (gridType == 'content') {
      colDef.push({
        ...defaultColumn,
        colId: 'group_names',
        headerName: 'Group Names',
        field: 'group_names',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Group Name',
        },
        menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
        minWidth: grid_widths_map['sm_column_sm'],
        cellRenderer:
          viewType == 'file'
            ? 'agGroupCellRenderer'
            : 'groupableGroupNameCellRenderer',
        cellRendererParams: {
          innerRenderer:
            viewType == 'file' ? 'groupableGroupNameCellRenderer' : null,
        },
        cellClass:
          'my-permission-cursor-pointer' +
          (viewType == 'folder' ? ' hide-expand-icon' : ''),
        hide: true,
      });
    }

    colDef.push({
      ...defaultColumn,
      colId: 'is_reviewed',
      headerName: 'Reviewed',
      field: 'is_reviewed',
      filter: 'agTextColumnFilter',
      floatingFilter: false,
      hide: true,
      menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass:
        'my-permission-cursor-pointer' +
        (viewType == 'folder' ? ' hide-expand-icon' : ''),
    });

    colDef.push({
      ...defaultColumn,
      colId: 'reviewed_by',
      headerName: 'Reviewed By',
      field: 'reviewed_by',
      filter: 'agTextColumnFilter',
      hide: true,
      floatingFilter: false,
      floatingFilterComponent: 'textFloatingFilterComponent',
      menuTabs: viewType === 'file' ? ['generalMenuTab'] : [],
      minWidth: grid_widths_map['sm_column_sm'],
      cellRenderer:
        viewType == 'file'
          ? 'agGroupCellRenderer'
          : 'ReviewedByNameComponentRenderer',
      cellRendererParams: {
        innerRenderer:
          viewType == 'file' ? 'ReviewedByNameComponentRenderer' : null,
      },
      cellClass:
        'my-permission-cursor-pointer' +
        (viewType == 'folder' ? ' hide-expand-icon' : ''),
    });

    colDef.push({
      ...defaultColumn,
      colId: 'review_count',
      headerName: '# of Reviews',
      field: 'review_count',
      filter: 'agTextColumnFilter',
      hide: true,
      floatingFilter: false,
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass:
        'my-permission-cursor-pointer' +
        (viewType == 'folder' ? ' hide-expand-icon' : ''),
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'NumericCellRenderer',
      },
    });

    colDef.push({
      ...defaultColumn,
      colId: 'last_reviewed_date_str',
      headerName: 'Review Date',
      field: 'last_reviewed_date_str',
      minWidth: grid_widths_map['sm_column_xm'],
      hide: true,
      comparator: dateSortNew('last_reviewed_date'),
    });

    return colDef;
  }

  formatTagsTooltip(tagsList) {
    if (tagsList && tagsList.length) {
      return tagsList.slice(1).join(', ');
    }
  }

  getSignedURL(entity: any, openDocument = true) {
    if (openDocument) {
      this.toaster.info('Opening the requested document.');
    }
    let id = entity.attachment_id ? entity.attachment_id : entity.id;
    let request = this.http.get(`attachments/${id}/signed_url`);
    if (openDocument) {
      request.subscribe((response: any) => {
        const popup = window.open(response, '_blank');
        this.popCheckerService.check(popup);
      });
    }
    return request;
  }

  downloadDocument(entity: any) {
    let id = entity.attachment_id ? entity.attachment_id : entity.id;
    let request = this.http.get(`attachments/${id}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
    return request;
  }

  documentGroupName(grid, row, col) {
    if (row.groupHeader && row.treeNode.children[0]) {
      const entity = row.treeNode.children[0].row.entity;
      const group = entity.group_names.length
        ? entity.group_names?.join()
        : 'Ungrouped';
      return group;
    }

    return row.entity.name;
  }

  getDocumentGroupName(grid, row, col) {
    const entity = row.entity;
    const group = entity.group_names.length
      ? entity.group_names?.join()
      : 'Ungrouped';
    return group;
  }

  setDocumentPageUrl(url: string) {
    this.documentPageUrl = url;
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
