import { Component, Input, OnInit } from '@angular/core';

export type Activity = {
  owner_name: string;
  created_at: Date;
  text: string;
};

@Component({
  selector: 'user-activity-card',
  templateUrl: './user-activity-card.component.html',
  styleUrls: ['./user-activity-card.component.css'],
})
export class UserActivityCard implements OnInit {
  @Input() activity: Activity;
  constructor() {}

  ngOnInit(): void {}
}
