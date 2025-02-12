import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard-column',
  templateUrl: './dashboard-column.component.html',
  styleUrls: ['./dashboard-column.component.css'],
})
export class DashboardColumnComponent implements OnInit {
  @Input() config;
  widgets;
  constructor() {}

  ngOnInit(): void {
    this.widgets = this.config.widgets;
  }
}
