import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  QueryList,
  ViewChildren,
  ElementRef,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { StateDiligenceUpdateType } from '../../store/questionnaire.modal';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { QuestionAttributeType } from '../../types/questions.type';
import { take, finalize } from 'rxjs/operators';
import { QuestionnaireStatusService } from '../../service/status.service';
import { UserState } from 'src/app2/store/user/user.state';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { QuestionState } from '../../store/questionnaire.state';
import { SidePanelUpdate } from '../../store/questionnaire.action';
import {
  diligenceStatusConstant,
  ResponseSource,
  responseStatus,
} from 'src/app2/shared/constants/constant';
import { ReviewType } from '../../constants/question-status.constant';
import { ReviewHistory } from 'src/app2/shared/models/responseHistory.model';
import { ResponseType } from '../../constants/Response-type.constant';
import { GridDataType } from '../../types/grid.type';
import { responseType } from 'src/app2/modules/template-builder/constants/responseType.constant';
import { CacheUtil } from '../../service/cache.service';
import { ResponseHistoryDisplayComponent } from 'src/app2/shared/components';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'qa-revision',
  templateUrl: './qa-revision.component.html',
  styleUrls: ['./qa-revision.component.css'],
})
export class QaRevisionComponent implements OnInit, OnDestroy {
  @Input() question: QuestionAttributeType;
  @Input() onSuccess;
  @Input() readOnly: boolean = false;
  diligence: DiligenceType & StateDiligenceUpdateType;
  history: ReviewHistory;
  loader: boolean = true;
  selector: string = 'textResponse';
  isRestorable: boolean;
  isEmpty: boolean = false;
  previousRevision: boolean = true;
  ResponseType = ResponseType;
  unsupportedResponseTypes: any[] = [
    ResponseType.Attachment,
    ResponseType.ReturnTable,
    ResponseType.aumTable,
  ];
  gridData: GridDataType;
  currUser: CurrentUserModel;
  firmPref;
  responseSource = ResponseSource;
  mode: 'normal' | 'restore' = 'normal'; // this will be decided from question's response type
  @ViewChildren('responseHistory')
  responseHistory: QueryList<ResponseHistoryDisplayComponent>;
  @Select(QuestionState.getQuestionChange) getQuestionChange;
  @Select(QuestionState.getSavedData) getSavedData;
  teamMembers;
  obvs;
  showFirmNameAsAuthor: boolean;

  constructor(
    private readonly store: Store,
    private readonly panel: SidePanelService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly status: QuestionnaireStatusService,
    private readonly cache: CacheUtil,
    private readonly util: UtilsService
  ) {}

  ngOnInit(): void {
    this.loader = true;
    this.init();
    const id = `${this.question.sequenceID}-${this.question.sectionID}-${this.question.id}`;
    this.obvs = this.getSavedData.subscribe((data) => {
      // if response is updated for the same question, initialize it again to update history
      if (data && id in data) {
        this.init();
      }
    });
  }

  init() {
    this.history = null;
    this.diligence = this.store.selectSnapshot(
      (state) => state.questionnaire.diligence
    );

    this.isRestorable =
      this.unsupportedResponseTypes.indexOf(this.question.responseType) == -1;

    this.currUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );

    this.firmPref = this.util.getFirmPreferences();
    this.showFirmNameAsAuthor =
      this.currUser.isInvestor && !this.diligence.is_internal;

    if (this.currUser.isInvestor && !this.diligence.is_internal) {
      this.isRestorable = false;
    }

    this.questionnaireService
      .getRevisionHistory(
        this.diligence.id,
        this.question.answer.id ?? this.question.deleted_response_id,
        this.diligence.status === diligenceStatusConstant.Evaluation
          ? ReviewType.Evaluation
          : ReviewType.InReview
      )
      .subscribe(
        (response1: any) => {
          let response = response1[0];
          if (response && Object.keys(response).length) {
            response.audits = response.audits?.filter(
              (audits) =>
                !(
                  audits.review?.status === diligenceStatusConstant.InReview &&
                  audits.review_status === diligenceStatusConstant.Started
                )
            );

            response.created_by_id = response.created_by;

            response.created_by = this.showFirmNameAsAuthor
              ? this.diligence.managerfirm_name
              : this.teamMembers.find(
                  (teamMember) => teamMember.id === response.created_by
                )?.fullName;

            response.audits?.forEach((audit) => {
              audit.created_by_id = audit.created_by;
              audit.responseDisplay = ' ';
              audit.created_by = this.showFirmNameAsAuthor
                ? this.diligence.managerfirm_name
                : this.teamMembers.find(
                    (teamMember) => teamMember.id === audit.created_by
                  )?.fullName;
            });
          }

          this.history = response;
          if (
            this.history &&
            (this.history.response_type === responseType.Grid ||
              this.history.response_type === responseType.DynamicGrid)
          )
            this.getGridStruct();
          else this.loader = false;
        },
        (err) => (this.loader = false)
      );
  }

  cancelPanel() {
    this.panel.close();
  }

  ngOnDestroy(): void {
    this.obvs?.unsubscribe();
  }

  handleRestore(index) {
    if (
      this.history.response_type === responseType.Grid ||
      this.history.response_type === responseType.DynamicGrid
    ) {
      this.responseHistory.toArray()[index].copyGridData();
      return;
    }

    this.status.handleUpdateActiveQuestion(this.question); // update the instance of tinymce editor to the current question

    // if (!this.history.audits[index].responseDisplay) index = index + 1;
    if (index >= this.history.audits.length) return;

    let restoredObj = this.status.updateRestoreFunction(
      {
        ...this.history.audits[index],
        response_type: this.history.response_type,
      },
      true
    );
    if (restoredObj) {
      this.onSuccess({
        localis_NA: this.history.audits[index].is_na,
        ...restoredObj,
      });
      this.store.dispatch(
        new SidePanelUpdate({
          response_type: this.history.response_type,
          questionID: this.history.question_id,
          localis_NA: this.history.audits[index].is_na,
          ...this.status.updateRestoreFunction(
            {
              ...this.history.audits[index],
              response_type: this.history.response_type,
            },
            false
          ),
        })
      );
    }
    setTimeout(() => {
      this.store.dispatch(new SidePanelUpdate(null));
    });
  }

  getGridStruct() {
    let expandedId = null;
    if (this.history.response_type === responseType.Grid)
      expandedId = `${this.history.sequence_id}-${this.history.section_id}-${this.history.question_id}`;
    else
      expandedId = `${this.history.sequence_id}-${this.history.section_id}-${this.history.question_id}-columnData`;
    if (expandedId in this.cache.GRIDCACHE) {
      this.gridData = this.cache.GRIDCACHE[expandedId];
      this.loader = false;
    } else
      this.questionnaireService
        .getQuestionGridData(
          this.history.grid_id,
          this.history.grid_version,
          null
        )
        .pipe(finalize(() => (this.loader = false)))
        .subscribe((rowData: GridDataType) => {
          this.cache.GRIDCACHE[expandedId] = rowData;
          this.gridData = rowData;
        });
  }
}
