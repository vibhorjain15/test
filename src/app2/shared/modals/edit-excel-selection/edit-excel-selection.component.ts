import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-edit-excel-selection',
  styleUrls: ['./edit-excel-selection.component.css'],
  templateUrl: './edit-excel-selection.component.html',
})
export class EditExcelSelectionComponent implements OnInit {
  @Input() params: any = {};
  @Input() selection: any = [];
  @Input() success: any;
  selectionData = [];

  columnTypeMap = {
    Section: 'Category',
    SubSection: 'SubCategory'
  }

  ngOnInit(): void {
    this.selectionData = JSON.parse(JSON.stringify(this.selection));
  }

  submit() {
    this.success(this.selectionData);
  }
}
