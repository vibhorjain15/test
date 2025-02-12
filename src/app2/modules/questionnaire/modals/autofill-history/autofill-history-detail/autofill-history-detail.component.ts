import { Component, Input, OnInit } from '@angular/core';
import { isArray } from 'angular';
import { timeHours } from 'd3';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { AutoFillTabType } from '../../../types/auto-fill.type';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'autofill-history-detail',
  templateUrl: './autofill-history-detail.component.html',
  styleUrls: ['./autofill-history-detail.component.css'],
})
export class AutofillHistoryDetailComponent implements OnInit {
  @Input() history;
  historyDetail;
  loader: boolean;
  showContentSetting: boolean;
  keywordConstants = keywordConstants;
  TabType = AutoFillTabType;
  currentUser: CurrentUserModel;
  constructor(
    private readonly questionnaireService: QuestionnaireService,
    private readonly utils: UtilsService
  ) {}
  ngOnInit(): void {
    this.loader = true;

    this.questionnaireService
      .getAutoFillHistoryDetail(this.history.diligence_id, this.history.id)
      .subscribe((detail) => {
        this.historyDetail = detail;
        this.organizeData();
        this.loader = false;
      });

    this.currentUser = this.utils.getCurrentUser();
    this.currentUser.isInvestor;
  }

  organizeData() {
    if (this.historyDetail.source_tab === AutoFillTabType.Advanced) {
      this.historyDetail.entity_settings = this.historyDetail.entity_settings
        .map((settings) => {
          let key = Object.keys(settings)[0];
          let value = Object.values(settings)[0];
          if (!Array.isArray(value))
            return {
              label: key,
              value: value,
            };
        })
        .filter((data) => data);
    } else if (
      this.historyDetail.source_entity_type === keywordConstants.Project
    ) {
      this.historyDetail.entity_settings =
        this.historyDetail.entity_settings.map((settings) => {
          let key = Object.keys(settings)[0];
          let value = Object.values(settings)[0];
          return {
            label: key,
            value: value,
          };
        });
      this.historyDetail.selectedEntity = [
        ...this.historyDetail.selected_products,
        ...this.historyDetail.selected_strategies,
        ...this.historyDetail.selected_vehicles,
        ...this.historyDetail.selected_firms,
      ];
    }

    this.historyDetail?.content_settings?.forEach((content) => {
      this.showContentSetting ||= content.value;
    });
  }
}
