import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { EntityType, ERROR_CODES } from 'src/app2/shared/constants/constant';
import { finalize, take } from 'rxjs/operators';
import { Select } from '@ngxs/store';
import { USER_ROLES } from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';
import { saveAs } from 'file-saver';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { FirmTagService } from 'src/app2/services/firm-tags.service';

import { BulkUploadMappingAPIService } from 'src/app2/services/bulk-upload-mapping/bulk-upload-mapping.service';
import { DvUploaderComponent } from 'src/app2/shared/components/dv-uploader/dv-uploader.component';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RouterService } from 'src/app2/services/router.service';
@Component({
  selector: 'app-bulk-actions',
  templateUrl: './bulk-actions.component.html',
  styleUrls: ['./bulk-actions.component.css'],
})
export class BulkActionsComponent implements OnInit, OnDestroy {
  @ViewChild(DvUploaderComponent) dvUploader: DvUploaderComponent;
  files;
  uploadType;
  allowed_file_extensions: string[];
  updatedParams: {};
  user_id: any;
  current_firm_id: any;
  maxFileSize: number;
  drop_files: any[];
  tabType: string;
  onlyNewUploadSources: string[];
  allowed_file_extensions_str: any;
  uploading_excel: boolean;
  new_document_uploaded: boolean;
  uploaded_file: any;
  Navigator: any = navigator;
  Window: any = window;
  @Select(UserState.getCurrentUserData) user$;
  isBusinessAdmin;
  fileName;
  selectedTypes = [];
  tabList: any = [
    {
      id: 1,
      name: 'Pre-defined',
      active: false,
      disabled: false,
      tooltip: '',
      hidden: false,
    },
    {
      id: 2,
      name: 'Custom Upload',
      active: false,
      disabled: true,
      tooltip: '',
      hidden: false,
    },
  ];
  loading: boolean = false;
  currentTab: any = 1;
  sheetNames: any;
  sheets: any[] = [];
  types = [];
  savedMappings: any;
  source_id: number = 2;
  mappingFields: any;
  selectedOptions: any = [];
  schema_format: any;
  uploading: boolean;
  selectedSheets: any[];
  showSheetError: boolean;
  clickedSubmit: boolean;
  haveMissingFields: boolean;
  isSavingMapping: boolean;
  firstPanelOpen = true;
  currentMappingIndex: number;
  isFreeSubscription: any;
  disableAddNew: boolean = false;
  isFreeManager: any;
  isFreeInvestor: any;
  selectedCheckboxCount: number = 0;

  constructor(
    private readonly toaster: ToastrService,
    private readonly NewModalFactory: CustomModalService,
    private readonly tagService: FirmTagService,
    private readonly BulkUploadMappingApiService: BulkUploadMappingAPIService,
    private readonly SweetAlert: SweetAlertService,
    private router: RouterService
  ) {
    this.createCustomField = this.createCustomField.bind(this);
  }

  ngOnInit(): void {
    this.tabList[this.currentTab - 1].active = true;
    this.allowed_file_extensions = ['.xls', '.xlsm', '.xlsx'];
    this.uploadType = {};
    this.updatedParams = {};
    this.maxFileSize = 50;
    this.drop_files = [];
    this.files = [];
    this.tabType = 'team_members';
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((data) => {
        if (data) {
          let current_user = JSON.parse(JSON.stringify(data));
          this.isBusinessAdmin =
            current_user.firmwide_role.toLowerCase() ==
            USER_ROLES.BUSINESSADMIN;
          this.isFreeSubscription = current_user.isFreeSubscription;
          this.isFreeManager = current_user.isFreeManager;
          this.isFreeInvestor = current_user.isFreeInvestor;
          this.tabList[1].disabled = this.isFreeSubscription;
          this.tabList[1].tooltip = this.isFreeSubscription
            ? 'Available to premium subscribers'
            : '';
        }
      });
    this.onlyNewUploadSources = [
      'detail',
      'list',
      'documentsEditClick',
      'firmDocumentsList',
    ];
    this.allowed_file_extensions_str = this.allowed_file_extensions.toString();
    this.router.createListener((url, extras) => {
      if (this.types.length) {
        event.preventDefault();
        this.SweetAlert.confirm({
          title: 'Are you sure, you want to leave this page?',
          text: 'Any unsaved changes will be lost.',
          confirmButtonText: 'Yes',
          focusCancel: true,
        }).then((isConfirm) => {
          if (isConfirm.value && isConfirm.value === true) {
            this.types = [];
            this.router.navigateAngular(url, extras);
          }
          if (isConfirm.dismiss && isConfirm.dismiss == 'cancel') {
            event.preventDefault();
          }
        });
        return true;
      } else {
        this.ngOnDestroy();
        this.router.navigateAngular(url, extras);
      }
      return null;
    });
  }
  getCustomFields() {
    this.BulkUploadMappingApiService.getCustomFields().subscribe((res: any) => {
      const typesToRemove: string[] = ['question'];
      this.mappingFields = this.removeFieldsWithTypes(res, typesToRemove);
    });
  }
  removeFieldsWithTypes(res, typesToRemove) {
    for (const key in res) {
      const updatedCustomFields = res[key]?.custom_fields?.filter(
        (field) => !typesToRemove.includes(field.type)
      );
      if (updatedCustomFields) res[key].custom_fields = updatedCustomFields;
    }
    return res;
  }
  getSavedMappings() {
    this.BulkUploadMappingApiService.getSavedMappings().subscribe(
      (savedMappings: any) => {
        if (savedMappings) {
          this.savedMappings = savedMappings.map((mapping: any) => {
            if (mapping.entity_type.toLowerCase() == 'user') {
              mapping.entity_type = 'contact';
            }
            return mapping;
          });
        }
      }
    );
  }

  downloadEmptySampleFile() {
    this.toaster.info('Please wait...', 'Downloading File', {
      timeOut: 0,
    });

    this.BulkUploadMappingApiService.downloadEmptySampleFile().subscribe(
      (res: any) => {
        this.toaster.clear();
        if (res.status == ERROR_CODES.ACCEPTED) {
          this.toaster.success(
            'Please check your email for the file. It may take upto 5 to 30 mins to generate the file.'
          );
        } else {
          this.processExcelFile(res, 'sample_predefined_file.xlsx');
        }
      },
      (error: any) => {
        this.toaster.clear();
        this.toaster.error('Error: File not downloaded.');
      }
    );
  }

  isOpenChange(event, type) {
    type.isOpen = event;
    this.currentMappingIndex = this.types.findIndex(
      (type) => type.isOpen == true
    );
  }

  handleUsePreviousMappingSelection(
    selectedPreviousMapping,
    type,
    index,
    updateWithoutPreview: boolean = false
  ) {
    if (type.sheet.columnHeaders.length > 0) {
      let matchedCount = 0;
      let mapping_metadata = {};
      let mappingFields: any;
      const temp = JSON.parse(JSON.stringify(type.sheet.mappingFields));
      for (let excelColumnName in selectedPreviousMapping.mapping_metadata) {
        let selectedColumnMapping =
          selectedPreviousMapping.mapping_metadata[excelColumnName];
        if (
          type.sheet.columnHeaders.includes(excelColumnName) &&
          type.mappingFields.includes(
            selectedPreviousMapping.mapping_metadata[excelColumnName]
          )
        ) {
          mapping_metadata[excelColumnName] =
            selectedPreviousMapping.mapping_metadata[excelColumnName];
          if (selectedColumnMapping) {
            mappingFields = temp.map((field) => {
              if (field.mappedExcelColumn == excelColumnName) {
                field.disabled = false;
                field.mappedExcelColumn = '';
              }
              if (field.name == selectedColumnMapping) {
                field.mappedExcelColumn = excelColumnName;
                field.disabled = true;
              }
              return field;
            });
          } else {
            mapping_metadata[excelColumnName] = '';
          }
          matchedCount++;
        }
      }
      this.previewMapping(
        mapping_metadata,
        selectedPreviousMapping,
        index,
        mappingFields,
        type.mandatoryFieldNames,
        type,
        updateWithoutPreview
      );
    }
  }
  handleColumnNameMapping(selectedColumnMapping, index, excelColumnHeader) {
    this.types[index].sheet.mappingFields = this.types[
      index
    ].sheet.mappingFields.map((field) => {
      if (field.mappedExcelColumn === excelColumnHeader) {
        field.disabled = false;
        field.mappedExcelColumn = '';
      }
      if (field.name === selectedColumnMapping) {
        field.mappedExcelColumn = excelColumnHeader;
        field.disabled = true;
      }
      return field;
    });
    this.updateCount(index);
  }

  handleClear(listIndex, excelColumnHeader) {
    delete this.types[listIndex].sheet.mapping_metadata[excelColumnHeader];
    this.types[listIndex].sheet.mappingFields = this.types[
      listIndex
    ].sheet.mappingFields.map((field) => {
      if (field.mappedExcelColumn === excelColumnHeader) {
        field.disabled = false;
        field.mappedExcelColumn = '';
      }
      return field;
    });
    this.updateCount(listIndex);
  }

  updateCount(index) {
    this.types[index].sheet.mappedCount = Object.keys(
      this.types[index].sheet.mapping_metadata
    ).length;
    let mappedValues = Object.values(this.types[index].sheet.mapping_metadata);
    this.types[index].sheet.mandatoryMappedCount = this.types[
      index
    ].mandatoryFieldNames.filter((name) => mappedValues.includes(name)).length;
  }

  previewMapping(
    mapping_metadata,
    preivousMappingSelected,
    index,
    mappingFields,
    mandatoryFieldNames,
    type,
    updateWithoutPreview
  ) {
    return this.NewModalFactory.invoke('preview-saved-mapping', {
      initialState: {
        canSelect: true,
        cancelButtonText: 'Cancel',
        mappings: mapping_metadata,
        mappingName: preivousMappingSelected.name,
        updateWithoutPreview: updateWithoutPreview,
        onCancelClick: () => {
          if (
            preivousMappingSelected &&
            preivousMappingSelected.id !=
              this.types[index].preivousMappingApplied?.id
          ) {
            this.types[index].preivousMappingSelected =
              this.types[index].preivousMappingApplied;
          } else {
            this.types[index].preivousMappingSelected = '';
          }
        },
        onProceedClick: (selectedMappingData) => {
          for (let selectedMappingKey in selectedMappingData) {
            Object.entries(this.types[index].sheet.mapping_metadata).forEach(
              ([key, value]) => {
                if (value === selectedMappingData[selectedMappingKey]) {
                  this.types[index].sheet.mapping_metadata[key] = undefined;
                }
              }
            );
            this.types[index].sheet.mapping_metadata[selectedMappingKey] =
              selectedMappingData[selectedMappingKey];
          }
          mappingFields = mappingFields.map((field) => {
            if (
              !Object.keys(selectedMappingData).includes(
                field.mappedExcelColumn
              )
            ) {
              field.mappedExcelColumn = '';
              field.disabled = false;
            }
            return field;
          });

          this.types[index].sheet.mappingFields = mappingFields;
          this.types[index].sheet.mappedCount = Object.keys(
            this.types[index].sheet.mapping_metadata
          ).length;
          this.types[index].sheet.mandatoryMappedCount =
            mandatoryFieldNames.filter((name) =>
              Object.values(this.types[index].sheet.mapping_metadata).includes(
                name
              )
            ).length;
          this.types[index].preivousMappingSelected = preivousMappingSelected;
          this.types[index].preivousMappingApplied = preivousMappingSelected;
          this.toaster.success(
            Object.keys(selectedMappingData).length +
              ' matching column(s) updated'
          );
          setTimeout(() => {
            this.NewModalFactory.close();
          }, 1000);
        },
      },
    });
  }

  customFieldWrapper(columnHeader: string) {
    return (tagName: string) => this.createCustomField(tagName, columnHeader);
  }
  createCustomField(tagName: any, columnHeader: string) {
    if (!this.disableAddNew) {
      this.disableAddNew = true;
      this.currentMappingIndex = this.types.findIndex(
        (type) => type.isOpen == true
      );
      const params = {
        schema_type: this.types[this.currentMappingIndex].entityType,
        entity_id: 0,
      };
      this.tagService.getCustumTags(
        params,
        (schema_format) => {
          this.schema_format = schema_format;
          this.disableAddNew = false;
          this.NewModalFactory.invoke('firm-tags', {
            initialState: {
              tagName: tagName,
              allowAddAnother: false,
              entityType: this.types[this.currentMappingIndex].entityType,
              entityTypeId: this.types[this.currentMappingIndex].entityTypeId,
              entityId: this.types[this.currentMappingIndex].entityId,
              schema_format: schema_format,
              source: 'bulk-upload',
              onSave: (responseObject) => {
                const { alias, is_mandatory, type } = responseObject;
                const newMappingField = {
                  id:
                    this.types[this.currentMappingIndex]?.sheet?.mappingFields
                      ?.length || 0,
                  name: alias,
                  label: this.getPlainTextFromHtml(
                    is_mandatory ? `${alias}*` : `${alias}`
                  ),
                  is_mandatory,
                  disabled: false,
                  mappedExcelColumn: '',
                };
                this.mappingFields[
                  this.types[this.currentMappingIndex].entityType
                ]?.custom_fields?.push({
                  is_mandatory: is_mandatory,
                  name: alias,
                  type: type,
                });
                const currentType = this.types[this.currentMappingIndex];

                currentType.sheet?.mappingFields?.push(newMappingField);
                currentType.mappingFields.push(alias);

                if (is_mandatory) {
                  currentType.mandatoryFieldNames.push(alias);
                }

                currentType.sheet.mappingFields = [
                  ...currentType.sheet.mappingFields,
                ];

                currentType.sheet.mapping_metadata[columnHeader] = alias;

                this.handleColumnNameMapping(
                  alias,
                  this.currentMappingIndex,
                  columnHeader
                );
              },
            },
          });
        },
        () => {}
      );
    }
  }
  removePanel(uploadTypeKey, type) {
    if (type) {
      this.SweetAlert.confirm({
        title: 'Are you sure, you want to delete?',
        text: 'Any unsaved changes will be lost.',
        confirmButtonText: 'Yes',
        focusCancel: true,
      }).then((isConfirm) => {
        if (isConfirm.value && isConfirm.value === true) {
          this.remove(uploadTypeKey);
        }
      });
    } else {
      this.remove(uploadTypeKey);
    }
  }
  remove(uploadTypeKey) {
    let deleteIndex = this.types.findIndex(
      (item) => uploadTypeKey == item.uploadTypeKey
    );
    if (deleteIndex >= 0) {
      this.uploadType[uploadTypeKey] = false;
      this.sheets = this.sheets.map((sheet) => {
        if (sheet.sheetId == this.types[deleteIndex].sheet.sheetId) {
          sheet.disabled = false;
        }
        return sheet;
      });
      this.types.splice(deleteIndex, 1);
    }
  }

  checkSelectedEntityCount(isTrue) {
    if (!this.uploading) {
      if (!this.files?.length && isTrue) {
        this.toaster.error('Please attach the excel file');
        return;
      }
      if (this.files?.length) {
        this.selectedCheckboxCount = Object.keys(this.uploadType).filter(
          (key) => this.uploadType[key] === true
        ).length;
        if (this.currentTab === 2) {
          this.showSheetError = this.selectedCheckboxCount > this.sheets.length;
          if (this.showSheetError) {
            return;
          }
        }
      }
    }
  }
  canProceedToNextStep(step) {
    this.firstPanelOpen = true;
    if (this.uploading) {
      this.toaster.warning('Kindly wait until the file is processed!');
      return;
    }
    this.getSavedMappings();
    if (!this.files?.length) {
      this.toaster.error('Please attach the excel file');
      return;
    }
    if (
      Object.keys(this.uploadType).filter(
        (key) => this.uploadType[key] === true
      ).length < 1
    ) {
      this.toaster.error('Please select entity types');
      return;
    }
    this.showSheetError =
      Object.keys(this.uploadType).filter(
        (key) => this.uploadType[key] === true
      ).length > this.sheets.length;
    if (this.showSheetError) {
      return;
    }
    this.clickedSubmit = false;
    const uploadTypes = {
      team_members: this.createType(
        'Team Member / User Roles',
        'team_member',
        EntityType.TeamMember,
        'TeamMember'
      ),
      firms: this.createType('Firm', 'firm', EntityType.Firm, 'Firm'),
      funds: this.createType('Product', 'fund', EntityType.Product, 'Product'),
      contacts: this.createType(
        'Contact',
        'contact',
        EntityType.Contact,
        'Contact'
      ),
      vehicles: this.createType(
        'Vehicle',
        'vehicle',
        EntityType.Vehicle,
        'Vehicle'
      ),
      strategy: this.createType(
        'Strategy',
        'strategy',
        EntityType.Strategy,
        'Strategy'
      ),
    };

    for (const [key, value] of Object.entries(this.uploadType)) {
      if (value) {
        if (!this.types.find((type) => type.uploadTypeKey == key)) {
          this.selectedTypes.push(uploadTypes[key].entityNameForPayload);
          this.types.push({
            panelName: uploadTypes[key].panelName,
            entityType: uploadTypes[key].entityType,
            entityTypeId: uploadTypes[key].entityTypeId,
            sourceId: uploadTypes[key].entityType,
            savedMappings: this.savedMappings.filter(
              (mapping: any) =>
                mapping.entity_type.toLowerCase() ===
                uploadTypes[key].entityType
            ),
            entityNameForPayload: uploadTypes[key].entityNameForPayload,
            mappingFields: uploadTypes[key].mappingFields.map(
              (field) => field.name
            ),
            uploadTypeKey: key,
            mandatoryFieldNames: uploadTypes[key].mappingFields
              .filter((item) => item.is_mandatory === true)
              .map((item) => item.name),
            isOpen: this.firstPanelOpen,
            preivousMappingSelected: '',
            preivousMappingApplied: '',
            sheet: {
              sheetName: '',
              sheetId: '',
              columnHeaders: [],
              mappingFields: uploadTypes[key].mappingFields.map(
                (item, index) => ({
                  id: index,
                  label: this.getPlainTextFromHtml(
                    item.is_mandatory ? `${item.name}*` : `${item.name}`
                  ),
                  name: item.name,
                  is_mandatory: item.is_mandatory,
                  disabled: false,
                  mappedExcelColumn: '',
                })
              ),
              mapping_metadata: {},
              mappedCount: 0,
              mandatoryMappedCount: 0,
            },
          });
          this.firstPanelOpen = false;
        }
      } else {
        this.removePanel(key, null);
      }
    }

    if (this.selectedTypes.length === 0) {
      this.toaster.error('Please select entity types');
      return;
    }
    step.next();
  }

  createType(panelName, entityType, entityTypeId, entityNameForPayload) {
    return {
      panelName,
      mappingFields: [
        ...this.mappingFields[entityType]['fields'],
        ...(this.mappingFields[entityType]['custom_fields'] || []),
        ...(this.mappingFields[entityType]['user_roles'] || []),
      ].sort(this.customSort),
      entityTypeId,
      entityType,
      entityNameForPayload,
    };
  }

  // Custom sorting function
  customSort(a: any, b: any): number {
    if (a.is_mandatory && !b.is_mandatory) {
      return -1; // `a` is mandatory, but `b` is not, so `a` comes first
    } else if (!a.is_mandatory && b.is_mandatory) {
      return 1; // `b` is mandatory, but `a` is not, so `b` comes first
    } else {
      // Both are either mandatory or not, sort them alphabetically
      return a.name.localeCompare(b.name);
    }
  }
  getPlainTextFromHtml(htmlText) {
    var tempDivElement = document.createElement('div');
    tempDivElement.innerHTML = htmlText;
    return tempDivElement.textContent || tempDivElement.innerText || '';
  }
  handlePrevious(step) {
    step.previous();
  }
  switchTab(tab) {
    if (this.types?.length) {
      this.SweetAlert.confirm({
        title: 'Are you sure, you want to leave this page?',
        text: 'Any unsaved changes will be lost.',
        confirmButtonText: 'Yes',
        focusCancel: true,
      }).then((isConfirm) => {
        if (isConfirm.value && isConfirm.value === true) {
          this.changeTab(tab);
        }
        if (isConfirm.dismiss && isConfirm.dismiss == 'cancel') {
          this.tabList = [...this.tabList];
        }
      });
    } else {
      this.changeTab(tab);
    }
  }
  changeTab(tab) {
    if (tab.name === 'Custom Upload') {
      this.getCustomFields();
      this.getSavedMappings();
    }
    this.tabList.forEach((tab) => {
      tab.active = false;
    });
    this.files = null;
    this.types = [];
    this.uploadType = {};
    this.currentTab = tab.id;
    tab.active = true;
  }
  handleChangeSheetName(selected, type) {
    let selectedSheet = this.sheets.find((sheet) => sheet.sheetId == selected);
    this.selectedSheets = [];
    if (selectedSheet.rowCount < 2) {
      if (type.sheet.sheetName) {
        setTimeout(() => {
          let previousSheet = this.sheets.find(
            (sheet) => sheet.sheetName == type.sheet.sheetName
          );
          type.sheet.sheetId = previousSheet.sheetId;
        }, 0);
      } else {
        setTimeout(() => {
          type.sheet.sheetId = '';
        }, 0);
      }
      this.SweetAlert.error({
        title: 'No records found in the selected sheet.',
        text: `Kindly pick another sheet or upload a new Excel file.`,
        confirmButtonText: 'Okay',
      });
      return;
    }
    if (type.sheet.sheetName) {
      this.SweetAlert.confirm({
        title: 'Are you sure, you want to change selected sheet?',
        text: 'Changing sheet will clear the current mappings! You can save current mapping by clicking on the save button to reuse later',
        confirmButtonText: 'Yes',
        focusCancel: true,
      }).then((isConfirm) => {
        if (isConfirm.value && isConfirm.value === true) {
          this.changeSheet(type, selectedSheet);
        }
        if (isConfirm.dismiss && isConfirm.dismiss == 'cancel') {
          let previousSheet = this.sheets.find(
            (sheet) => sheet.sheetName == type.sheet.sheetName
          );
          type.sheet.sheetId = previousSheet.sheetId;
        }
      });
    } else {
      this.changeSheet(type, selectedSheet);
    }
  }

  changeSheet(type, selectedSheet) {
    type.sheet.sheetId = selectedSheet.sheetId;
    type.sheet.sheetName = selectedSheet.sheetName;
    type.sheet.columnHeaders = selectedSheet.columnHeaders;
    this.types.forEach((type) => {
      if (type?.sheet?.sheetName) {
        this.selectedSheets.push(type.sheet.sheetId);
      }
    });
    this.sheets = this.sheets.map((sheet) => {
      sheet.disabled = this.selectedSheets.includes(sheet.sheetId);
      return sheet;
    });
    this.resetMapping(type);
  }

  downloadSampleFile() {
    this.toaster.info('Please wait...', 'Downloading File', {
      timeOut: 0,
    });
    this.BulkUploadMappingApiService.downloadSampleFile().subscribe(
      (response: any) => {
        this.toaster.clear();
        if (response.status == ERROR_CODES.ACCEPTED) {
          this.toaster.success(
            'Please check your email for the file. It may take upto 5 to 30 mins to generate the file.'
          );
        } else {
          this.processExcelFile(
            response,
            'alldata_sample_predefined_file.xlsx'
          );
        }
      },
      (error: any) => {
        this.toaster.clear();
      }
    );
  }

  downloadInstructionFile() {
    this.toaster.info('Please wait...', 'Downloading File', {
      timeOut: 0,
    });
    this.BulkUploadMappingApiService.downloadInstructionFile().subscribe(
      (response: any) => {
        this.toaster.clear();
        if (response.status == ERROR_CODES.ACCEPTED) {
          this.toaster.success(
            'Please check your email for the file. It may take upto 5 to 30 mins to generate the file.'
          );
        } else {
          saveAs(response, 'custom_upload_instructions.xlsx');
        }
      },
      (error: any) => {
        this.toaster.clear();
      }
    );
  }

  previewMappingCount(dvStepper) {
    if (!this.files?.length) {
      this.toaster.error('Please attach the excel file');
      return;
    }
    this.clickedSubmit = true;
    this.haveMissingFields = false;
    this.types.forEach((type) => {
      if (
        type.mandatoryFieldNames?.length > 0 &&
        type.mandatoryFieldNames?.length > type.sheet.mandatoryMappedCount
      ) {
        this.isOpenChange(true, type);
        this.haveMissingFields = true;
      }
    });
    if (this.haveMissingFields) {
      this.toaster.error('Missing mandatory fields');
      return;
    }
    this.NewModalFactory.invoke('preview-mapping-count', {
      initialState: {
        types: this.types,
        onProceedClick: () => {
          this.addCustomDocumentSubmit(dvStepper);
        },
        onCancelClick: () => {
          this.NewModalFactory.close();
        },
      },
      class: 'modal-md',
    });
  }

  handleSelectedTypesForCustomUpload() {
    this.selectedTypes = [];
    if (this.uploadType.team_members && !this.isBusinessAdmin) {
      this.selectedTypes.push('TeamMember');
    }
    if (this.uploadType.firms) {
      this.selectedTypes.push('Firm');
    }
    if (this.uploadType.funds) {
      this.selectedTypes.push('Product');
    }
    if (this.uploadType.contacts) {
      this.selectedTypes.push('Contact');
    }
    if (this.uploadType.vehicles) {
      this.selectedTypes.push('Vehicle');
    }
    if (this.uploadType.strategy) {
      this.selectedTypes.push('Strategy');
    }
  }
  addCustomDocumentSubmit(step) {
    this.handleSelectedTypesForCustomUpload();
    if (this.selectedTypes.length === 0) {
      this.toaster.error('Please select entity types');
      return;
    }
    const selectedTypesStr = this.selectedTypes.join();
    let mapping_metadata: any = {};
    let sheet_mappings: any = {};
    this.types.forEach((type) => {
      mapping_metadata[type.entityNameForPayload] = type.sheet.mapping_metadata;
      sheet_mappings[type.entityNameForPayload] = type.sheet.sheetName;
    });
    mapping_metadata = {
      ...mapping_metadata,
      sheet_mappings,
    };
    const payload: any = new FormData();
    this.uploading_excel = true;
    this.files.forEach((file: File) => {
      payload.append('file', file);
      payload.append('import_types', selectedTypesStr);
      payload.append('mapping_metadata', JSON.stringify(mapping_metadata));
      this.BulkUploadMappingApiService.bulkEntityUpload(payload).subscribe(
        (response: any) => {
          this.toaster.success('Request successful, Please check your email');
          this.uploading_excel = false;
          this.files = null;
          Object.keys(this.uploadType).forEach((key) => {
            this.uploadType[key] = false;
          });
          this.types = null;
          this.sheets = null;
          this.fileName = null;
          this.clickedSubmit = false;
          step.previous();
          window.scroll({
            top: 0,
            left: 0,
            behavior: 'smooth',
          });
        },
        (error) => {
          this.uploading_excel = false;
          this.files = [];
          Object.keys(this.uploadType).forEach((key) => {
            this.uploadType[key] = false;
          });
        }
      );
    });
  }
  handleSelectedTypes() {
    this.selectedTypes = [];
    if (this.uploadType.team_members && !this.isBusinessAdmin) {
      this.selectedTypes.push('TeamMember');
    }
    if (this.uploadType.firms && !(this.isFreeInvestor || this.isFreeManager)) {
      this.selectedTypes.push('Firm');
    }
    if (this.uploadType.funds && !this.isFreeInvestor) {
      this.selectedTypes.push('Product');
    }
    if (
      this.uploadType.contacts &&
      !(this.isFreeInvestor || this.isFreeManager)
    ) {
      this.selectedTypes.push('Contact');
    }
    if (this.uploadType.vehicles && !this.isFreeInvestor) {
      this.selectedTypes.push('Vehicle');
    }
    if (this.uploadType.strategy && !this.isFreeInvestor) {
      this.selectedTypes.push('Strategy');
    }
  }
  addDocumentSubmit() {
    if (!this.files?.length) {
      this.toaster.error('Please attach the excel file');
      return;
    }
    this.handleSelectedTypes();
    if (this.selectedTypes.length === 0) {
      this.toaster.error('Please select entity types');
      return;
    }
    const selectedTypesStr = this.selectedTypes.join();
    const payload = new FormData();
    this.uploading_excel = true;
    this.files.forEach((file: File) => {
      payload.append('file', file);
      payload.append('import_types', selectedTypesStr);
      payload.append('mapping_metadata', null);
      this.BulkUploadMappingApiService.bulkEntityUpload(payload)
        .pipe(finalize(() => (this.dvUploader.files = [])))
        .subscribe(
          (response: any) => {
            this.toaster.success('Request successful, Please check your email');
            this.uploading_excel = false;
            this.files = [];
            Object.keys(this.uploadType).forEach((key) => {
              this.uploadType[key] = false;
            });
          },
          (error) => {
            this.uploading_excel = false;
            this.files = [];
            Object.keys(this.uploadType).forEach((key) => {
              this.uploadType[key] = false;
            });
          }
        );
    });
  }

  selectType(type: any) {
    this.tabType = type;
  }

  processExcelFile(response, fileName) {
    let blob: any, ex: any;
    const octetStreamMime = 'application/octet-stream';
    let success = false;
    const filename = fileName || 'download.xlsx';
    // Determine the content type from the header or default to "application/octet-stream"
    const contentType = response.headers.get('content-type') || octetStreamMime;
    try {
      // Try using msSaveBlob if supported
      blob = new Blob([response.body], { type: contentType });
      if (this.Navigator.msSaveBlob) {
        this.Navigator.msSaveBlob(blob, filename);
      } else {
        // Try using other saveBlob implementations, if available
        const saveBlob =
          this.Navigator.webkitSaveBlob ||
          this.Navigator.mozSaveBlob ||
          this.Navigator.saveBlob;
        if (!saveBlob) {
          throw 'Not supported';
        }
        saveBlob(blob, filename);
      }
      success = true;
    } catch (error) {
      ex = error;
    }
    if (!success) {
      // Get the blob url creator
      const urlCreator =
        this.Window.URL ||
        this.Window.webkitURL ||
        this.Window.mozURL ||
        this.Window.msURL;
      if (urlCreator) {
        // Try to use a download link
        let url: any;
        const link = document.createElement('a');
        if ('download' in link) {
          // Try to simulate a click
          try {
            // Prepare a blob URL
            blob = new Blob([response.body], { type: contentType });
            url = urlCreator.createObjectURL(blob);
            link.setAttribute('href', url);
            // Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
            link.setAttribute('download', filename);
            // Simulate clicking the download link
            const event = document.createEvent('MouseEvents');
            event.initMouseEvent(
              'click',
              true,
              true,
              window,
              1,
              0,
              0,
              0,
              0,
              false,
              false,
              false,
              false,
              0,
              null
            );
            link.dispatchEvent(event);
            success = true;
          } catch (error1) {
            ex = error1;
          }
        }
        if (!success) {
          // Fallback to window.location method
          try {
            // Prepare a blob URL
            // Use application/octet-stream when using window.location to force download
            blob = new Blob([response.body], { type: octetStreamMime });
            url = urlCreator.createObjectURL(blob);
            window.location = url;
            success = true;
          } catch (error2) {
            ex = error2;
          }
        }
      }
    }
    if (!success) {
      // Fallback to window.open method
      // TODO: define httpPath
      /* const popup = window.open(httpPath, '_blank', '');
      PopupCheckerService.check(popup); */
    }
  }

  dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    this.uploadType = {};
    this.types = [];
    this.selectedTypes = [];
    this.showSheetError = false;
    if (this.currentTab == 2) {
      this.getSheetandColumnNames(files);
    }
  }

  getSheetandColumnNames(files) {
    this.uploading = true;
    const file = files[0];
    this.fileName = file.name;
    this.sheets = [];

    // Create a new web worker
    const worker = new Worker(
      new URL('./bulk-actions.worker', import.meta.url)
    );

    // Listen for messages from the worker
    worker.onmessage = ({ data }) => {
      // Handle the data received from the worker
      this.sheets = data;
      this.uploading = false;
    };

    // Send the file to the worker
    worker.postMessage(file);
  }

  resetMapping(type) {
    type.sheet.mapping_metadata = {};
    type.sheet.mappingFields = type.sheet.mappingFields.map((item) => {
      item.disabled = false;
      item.mappedExcelColumn = '';
      return item;
    });
    type.preivousMappingSelected = '';
    type.preivousMappingApplied = '';
    type.sheet.mappedCount = 0;
    type.sheet.mandatoryMappedCount = 0;
  }
  saveCurrentMapping() {
    this.currentMappingIndex = this.types.findIndex(
      (type) => type.isOpen == true
    );
    this.NewModalFactory.invoke('save-bulk-upload-mapping', {
      initialState: {
        mapping: this.types[this.currentMappingIndex].sheet.mapping_metadata,
        entity_type: this.types[this.currentMappingIndex].entityTypeId,
        source_id: this.source_id,
        onSaveNewMapping: (newMapping) => {
          newMapping.entity_type =
            this.types[this.currentMappingIndex].entityType;
          const mappings = JSON.parse(JSON.stringify(newMapping));
          this.savedMappings = [mappings, ...this.savedMappings];
          this.types[this.currentMappingIndex].savedMappings =
            this.savedMappings.filter(
              (mapping) =>
                mapping.entity_type.toLowerCase() ==
                this.types[this.currentMappingIndex].entityType
            );
          this.handleUsePreviousMappingSelection(
            mappings,
            this.types[this.currentMappingIndex],
            this.currentMappingIndex,
            true
          );
        },
      },
      class: 'modal-lg',
    });
  }
  confirmBeforeUpdatePreviousSelectedMapping(type) {
    if (type?.preivousMappingSelected?.id) {
      this.SweetAlert.confirm({
        title: ' Are you sure, you want to update the mapping?',
        text: `By confirming the ${type.preivousMappingSelected.name} will be updated.`,
        confirmButtonText: 'Yes',
        focusCancel: true,
      }).then((isConfirm) => {
        if (isConfirm.value && isConfirm.value === true) {
          this.updatePreviousSelectedMapping(type);
        }
      });
    }
  }
  updatePreviousSelectedMapping(type) {
    let payload = {
      id: type.preivousMappingSelected.id,
      name: type.preivousMappingSelected.name,
      description: type.preivousMappingSelected.description,
      source_id: this.source_id,
      entity_type: type.entityTypeId,
      mapping_metadata: type.sheet.mapping_metadata,
    };
    this.isSavingMapping = true;
    this.BulkUploadMappingApiService.updateMapping(payload).subscribe(
      (res) => {
        const mappings = JSON.parse(
          JSON.stringify(type.sheet.mapping_metadata)
        );
        this.savedMappings = this.savedMappings.map((mapping) => {
          if (mapping.id == type.preivousMappingSelected.id) {
            mapping.mapping_metadata = mappings;
          }
          return mapping;
        });
        type.savedMappings = this.savedMappings.filter(
          (mapping) => mapping.entity_type.toLowerCase() == type.entityType
        );
        this.isSavingMapping = false;
        this.toaster.success('Updated Successfully.');
      },
      (err) => {
        this.toaster.error('Something went wrong.');
        this.isSavingMapping = false;
      }
    );
  }

  ngOnDestroy() {
    this.router.destroyListener();
  }
}
