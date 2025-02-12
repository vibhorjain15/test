import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-account-activity',
  templateUrl: './account-activity.component.html',
  styleUrls: ['./account-activity.component.css'],
})
export class AccountActivityComponent implements OnInit {
  sessions;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get(`sessions`)
      .subscribe((response) => (this.sessions = response));
  }
}

