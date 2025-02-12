import { Component, Input, OnInit } from '@angular/core';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { FILTER_TERNARY_OPERATORS } from 'src/app2/shared/constants/constant';
import { SuggestedResponseItem } from '../../types/qa-bank.type';
import { ToastrService } from 'ngx-toastr';
import { QaTabType } from 'src/app2/modules/qa-bank/constants/qa-bank.constants';
import { ArchiveFilter } from 'src/app2/modules/qa-bank/constants/qa-bank-filters.constants';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
import { UtilsService } from 'src/app2/services/utils.service';
interface SuggestedResponseItemModel {
  question_text: string;
  responses: {
    text: string;
    meta: string;
    icons: {
      name: string;
      class: string;
    }[];
    isSelected: boolean;
    tags: string[];
  }[];
}

@Component({
  selector: 'suggested-responses',
  templateUrl: './suggested-responses.component.html',
  styleUrls: ['./suggested-responses.component.css'],
})
export class SuggestedResponsesComponent implements OnInit {
  selectedButton: string;
  qa: SuggestedResponseItemModel[];
  filteredQa;
  searchParameter: string = '';
  isLoading: boolean;
  isFooter: boolean = true;
  metaClass = ['meta-info'];
  tabs = [
    {
      name: 'Library',
      active: false,
      type: QaTabType.Library,
      disabled: false,
      condition: true,
      tooltip: 'Search your Library',
    },
    {
      name: 'Project Responses',
      active: true,
      type: QaTabType.ProjectHistory,
      disabled: false,
      condition: true,
      tooltip: 'Search investor requests and standard DDQs',
    },
  ];
  showSearchSpinner: boolean = false;
  isAnyResponseSelected: boolean = false;

  @Input() firmPreferences;
  @Input() currentUser;
  @Input() question;
  @Input() diligence;
  @Input() onAddSelectedResponses;

  constructor(
    private readonly panel: SidePanelService,
    private readonly dueDiligenceDataService: DueDiligenceDataService,
    private readonly dvDatePipe: DvDatePipe,
    private readonly toaster: ToastrService,
    private readonly utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    let preApprovedTab = this.tabs.find((tab) => tab.type == QaTabType.Library);
    let projectResponse = this.tabs.find(
      (tab) => tab.type === QaTabType.ProjectHistory
    );
    preApprovedTab.disabled = this.currentUser.isFreeSubscription;
    preApprovedTab.name = this.currentUser.isManager
      ? QaTabType.Library
      : 'Profile Content';

    if (!this.currentUser.isManager) {
      preApprovedTab.tooltip = '';
      projectResponse.tooltip = '';
    }

    if (
      this.firmPreferences.set_preapproved_default &&
      !this.currentUser.isFreeSubscription &&
      this.currentUser.isManager
    ) {
      let index = this.tabs.findIndex((tab) => tab.type == QaTabType.Library);
      this.tabs.find((tab) => tab.type == QaTabType.Library).active = true;
      this.tabs.find((tab) => tab.type == QaTabType.ProjectHistory).active =
        false;
      this.setResponseFilter(index);
    } else {
      let index = this.tabs.findIndex(
        (tab) => tab.type == QaTabType.ProjectHistory
      );
      this.tabs.find((tab) => tab.type == QaTabType.Library).active = false;
      this.tabs.find((tab) => tab.type == QaTabType.ProjectHistory).active =
        true;
      this.setResponseFilter(index);
    }
  }

  onCancelClick() {
    this.panel.close();
  }

  searchQa(params, showSpinner = false) {
    this.showSearchSpinner = showSpinner;
    this.filteredQa = this.qa.filter(
      (q) =>
        (q.question_text &&
          q.question_text.toLowerCase().search(params.toLowerCase()) !== -1) ||
        q.responses.filter(
          (response) =>
            (response.text &&
              response.text.toLowerCase().search(params.toLowerCase()) !==
                -1) ||
            response.tags?.some(
              (tag) =>
                tag && tag.toLowerCase().search(params.toLowerCase()) !== -1
            )
        ).length > 0
    );
    setTimeout(() => (this.showSearchSpinner = false), 300);
  }

  setResponseFilter(index) {
    let type: QaTabType = this.tabs[index].type;
    this.isLoading = true;
    let isQaSearchEnabled =
      this.firmPreferences.enableQASearch ||
      this.currentUser.userName.toLowerCase().indexOf('diligencevault.com') >
        -1;

    this.getQaFromEs(type).subscribe((qa: any) => {
      this.qa = this.getQaModel(qa?.data ?? []);
      this.filteredQa = this.qa;
      this.isLoading = false;
    });
  }

  getQaModel(qa: SuggestedResponseItem[]) {
    return qa.map((data) => {
      return {
        question_text: data.question_text,
        responses: data.responses.map((response) => {
          return {
            text: response.response_text,
            meta: `${response.response_created_by_name} added${
              response.response_created_at
                ? ' on ' +
                  this.dvDatePipe.transform(response.response_created_at)
                : ''
            } for ${response.associated_entity} (${
              response.associated_template
            })`,
            icons: [
              {
                name: 'plus',
                class: 'btn btn-default',
                tooltip: 'Select this response',
              },
            ],
            isSelected: false,
            tags: response.tags?.map((tag) => tag.tag_name) ?? [],
          };
        }),
      };
    });
  }

  getQaFromEs(type: QaTabType) {
    let params = { filters: {} };
    params.filters[FILTER_TERNARY_OPERATORS.AND] = [
      {
        filter_name: 'question_text',
        filter_type: 'str',
        search_type: 'contains',
        filter_value: this.question.text,
      },
      {
        filter_name: 'question_id',
        filter_type: 'id',
        search_type: 'exact',
        filter_value: this.question.id,
      },
    ];

    const archiveFilter = ArchiveFilter; // Archive filter false
    params.filters[FILTER_TERNARY_OPERATORS.AND].push(archiveFilter);

    if (type === QaTabType.Library) {
      params.filters[FILTER_TERNARY_OPERATORS.AND].push({
        filter_name: 'diligence_type',
        filter_type: 'str',
        search_type: 'exact',
        filter_value: -1,
      });
    }

    if (type === QaTabType.ProjectHistory)
      params.filters[FILTER_TERNARY_OPERATORS.AND].push({
        filter_name: 'diligence_type',
        filter_type: 'dropdown',
        search_type: 'exact',
        filter_value: [1243, 1242, 1241, 2, 0, 3], // This filter is for showing every questions from every diligence type except from pre-approved
      });

    return this.dueDiligenceDataService.getAvailableQuestionsAndResponsesEs(
      params
    );
  }

  handleSelectionChange(eventData) {
    eventData.contentItem.isSelected = !eventData.contentItem.isSelected;
    eventData.contentItem.icons[0].name = eventData.contentItem.isSelected
      ? 'check'
      : 'plus';
    eventData.contentItem.icons[0].class = eventData.contentItem.isSelected
      ? 'btn btn-primary'
      : 'btn btn-default';
    eventData.contentItem.icons[0].tooltip = eventData.contentItem.isSelected
      ? 'Unselect this response'
      : 'Select this response';

    this.updateResponseSelection();
  }

  updateResponseSelection(): void {
    for (let i in this.qa) {
      for (let j in this.qa[i].responses) {
        if (
          this.qa[i].responses[j].isSelected &&
          this.qa[i].responses[j].text?.length > 0
        ) {
          this.isAnyResponseSelected = true;
          return;
        }
      }
    }

    this.isAnyResponseSelected = false;
  }

  addSelectedResponses() {
    let response = '';
    for (let i in this.qa) {
      for (let j in this.qa[i].responses) {
        if (
          this.qa[i].responses[j].isSelected &&
          this.qa[i].responses[j].text?.length > 0
        ) {
          response += this.qa[i].responses[j].text + ' ';
        }
      }
    }

    if (!response.trim()) {
      this.toaster.error('', 'Please select at least one response');
      return;
    }

    this.onAddSelectedResponses(
      this.utilsService.stripCommentsAndTrackChanges(
        response
          .trim()
          ?.replace(/<br>/g, '\n')
          ?.replace(/<\/br>/g, '\n')
          ?.replace(/<br\/>/g, '\n')
          ?.replace(/<br \/>/g, '\n') ?? ''
      )
    );
    this.panel.close();
  }

  closePanel() {
    this.panel.close();
  }
}
