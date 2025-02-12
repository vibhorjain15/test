import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';

@Component({
  selector: 'autofill-content-settings',
  templateUrl: './autofill-content-settings.component.html',
  styleUrls: ['./autofill-content-settings.component.css'],
})
export class AutofillContentSettingsComponent implements OnInit {
  firmPreferences: any;
  includePreApproved: boolean;
  includeExpired: boolean;
  includeStandard: boolean;
  includeVerified: boolean;
  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.firmPreferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    this.includePreApproved =
      this.firmPreferences.autofill_include_pre_approved;
    this.includeExpired = this.includePreApproved
      ? this.firmPreferences.autofill_include_pre_approved_expired
      : false;
    this.includeStandard = this.firmPreferences.autofill_include_standard;
  }

  onIncludePreApprovedChange(value) {
    if (!value) {
      this.includeExpired = false;
    }
  }

  getSelectedContentSettings() {
    return {
      includePreApproved: this.includePreApproved,
      includeExpired: this.includeExpired,
      includeStandard: this.includeStandard,
      includeVerified: this.includeVerified,
    };
  }

  getContentSettingSnapShot() {
    return [
      { label: 'Include Q/A library content', value: this.includePreApproved },
      {
        label: 'Include expired Q/A library content',
        value: this.includeExpired,
      },
      {
        label: 'Include project responses',
        value: this.includeStandard,
      },
      {
        label: 'Only include approved responses',
        value: this.includeVerified,
      },
    ];
  }
}
