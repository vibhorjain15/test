import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-dv-multiheader-table',
  templateUrl: './dv-multiheader-table.component.html',
  styleUrls: ['./dv-multiheader-table.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DvMultiheaderTableComponent implements OnInit {
  @Input() rowData;
  constructor() {}

  ngOnInit(): void {}
}
