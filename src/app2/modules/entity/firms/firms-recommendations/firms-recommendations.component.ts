import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { take, tap } from 'rxjs/operators';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { IssueType } from 'src/app2/shared/constants/constant';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'firms-recommendations',
  templateUrl: './firms-recommendations.component.html',
})
export class FirmsRecommendationsComponent implements OnInit {
  stateParams: any;
  entity_type: string;
  entity_id: any;
  @Select(UserState.getFirmPreferenceData) getFirmPreferenceData;
  firm: Object;

  constructor(
    private readonly route: RouterService,
    private readonly store: Store,
    private readonly firmDataService: FirmDataService
  ) {}

  ngOnInit(): void {
    this.entity_type = IssueType.Firm;
    this.stateParams = this.route.getState().params;
    if (this.stateParams.firmId) {
      this.entity_id = this.stateParams.firmId;
      this.getFirm();
    } else {
      this.getFirmPreferenceData
        .pipe(
          take(2),
          tap((firmPreference) => {
            if (!firmPreference) {
              this.store.dispatch(new GetCurrentUser());
            }
          })
        )
        .subscribe((data) => {
          if (data) {
            this.entity_id = data.firm_id;
            this.getFirm();
          }
        });
    }
  }

  getFirm() {
    if (this.entity_id) {
      this.firmDataService.getFirm(this.entity_id).subscribe((firm) => {
        this.firm = firm;
      });
    }
  }
  navigateToFirms() {
    this.route.navigate(`app.monitor.firms`);
  }
}
