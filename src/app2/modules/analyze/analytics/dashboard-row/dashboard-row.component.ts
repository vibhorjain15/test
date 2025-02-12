import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard-row',
  templateUrl: './dashboard-row.component.html',
  styleUrls: ['./dashboard-row.component.css'],
})
export class DashboardRowComponent implements OnInit {
  @Input() config;

  constructor() {}

  ngOnInit(): void {}
}
