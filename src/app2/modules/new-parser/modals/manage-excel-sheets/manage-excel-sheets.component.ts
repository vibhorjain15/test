import { Component, Input, OnInit } from '@angular/core';
import { TemplatesDataService } from 'src/app2/services/template-data.service';

@Component({
  selector: 'app-manage-excel-sheets',
  templateUrl: './manage-excel-sheets.component.html',
})
export class ManageExcelSheetsComponent implements OnInit {
  @Input() sheets: any;
  @Input() disabledMode: boolean;
  @Input() success: any;
  @Input() selectedSheetNo: any;
  @Input() type: 'edit_sheets' | 'apply_style' = 'edit_sheets';
  activeTab = 'Question';
  disableOtherSheets = false;
  sheetsData: any;
  titleMap = {
    edit_sheets: 'Edit Working Sheets',
    apply_style: 'Apply same styles',
  };
  constructor(private templatesDataService: TemplatesDataService) {}

  ngOnInit(): void {
    if (this.sheets && this.sheets?.length) {
      this.sheetsData = JSON.parse(JSON.stringify(this.sheets));
      this.sheetsData.forEach((x) => (x.apply_style = x.is_active && true));
    }

    if (this.disabledMode) {
      this.disableOtherSheets = true;
    }
  }

  save(callback: any) {
    this.templatesDataService.setSelectedSheets(this.sheetsData);
    this.success(this.sheetsData, this.disableOtherSheets);
    callback();
  }
}
