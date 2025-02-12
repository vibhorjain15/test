import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-sync-settings',
  templateUrl: './sync-settings.component.html',
  styleUrls: ['./sync-settings.component.css'],
})
export class SyncSettingsComponent implements OnInit {
  enable_sync = false;
  saving = false;
  frequencyList: any = [
    { id: 2, value: 'Daily' },
    { id: 1, value: 'Weekly' },
    { id: 3, value: 'Fortnightly' },
    { id: 4, value: 'Monthly' },
  ];
  frequencyVal: any;
  dayVal: any;
  toggleMoreDropDown: boolean = false;
  mytime: Date = new Date();
  enableSyncForm: FormGroup;

  constructor() {}

  ngOnInit(): void {
    this.enableSyncForm = new FormGroup({
      frequencyVal: new FormControl(null, [Validators.required]),
      startDate: new FormControl(new Date(), [Validators.required]),
      startTime: new FormControl(new Date()),
    });
  }
}
