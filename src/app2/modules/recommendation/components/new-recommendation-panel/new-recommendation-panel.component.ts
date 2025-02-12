import { Component, Input, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'new-recommendation-panel',
  templateUrl: './new-recommendation-panel.component.html',
  styleUrls: ['./new-recommendation-panel.component.css'],
})
export class NewRecommendaitonPanelComponent implements OnInit {
  @Input() panelTitle = 'Add Recommendation';
  @Input() editingRecommendation: any;
  @Input() entity_type: any;
  @Input() entity_id: any;
  @Input() diligence: any;
  @Input() onSaveIssue: any;
  @Input() onUpdateIssue: any;
  @Input() onCancelIssue: any;
  loading: boolean;
  @Select(UserState.getFirmPreferenceData) firmPref;
  firm_preferences: any;
  constructor() {}

  ngOnInit(): void {
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.firm_preferences = JSON.parse(JSON.stringify(pref));
        this.panelTitle =
          'Add ' + this.firm_preferences.issue_tracker_default_name;
      }
    });
  }
  handleOnSave(createdRecommendation) {
    this.onSaveIssue(createdRecommendation);
  }
  handleOnUpdate(udpatedRecommendation) {
    this.onUpdateIssue(udpatedRecommendation);
  }
  handleOnCancel(questionTouched) {
    this.onCancelIssue(questionTouched);
  }
}
