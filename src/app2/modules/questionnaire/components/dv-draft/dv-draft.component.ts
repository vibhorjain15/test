import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { DvDraftService } from '../../service/draft.service';
import {
  GetQuestionCount,
  getReviewAssignments,
  GetTrackChanges,
  UpdateDraftData,
} from '../../store/questionnaire.action';
import { QuestionState } from '../../store/questionnaire.state';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { QuestionnaireStatusService } from '../../service/status.service';

@Component({
  selector: 'dv-draft',
  templateUrl: './dv-draft.component.html',
  styleUrls: ['./dv-draft.component.css'],
})
export class DvDraftComponent implements OnInit, OnDestroy {
  background = ColorTheme.darkBlue;
  isDraftSaving = false;
  isSaving = false;
  totalQuestion = 0;
  unAnsweredQuestion = 0;
  totalAnswer = 0;
  questionsCount = 0;
  progress: any = 0;
  apiData = [];
  sequenceIdMap = {};
  @Select(QuestionState.getDraftData) draft;
  @Select(QuestionState.getDiligence) diligence;
  @Select(QuestionState.getQuestionnaireCount) totalCounter;
  draftSub;
  counterSub;
  questionSet = new Set();
  wipTotal = 0;
  pendingDraft = 0;
  activePanelSub = null;
  defaultDisplay = 'center';
  defaultPadding = '190px';

  onlyCount = 0;

  constructor(
    private store: Store,
    private draftService: DvDraftService,
    private panelService: SidePanelService,
    private readonly status: QuestionnaireStatusService
  ) {}

  ngOnInit(): void {
    this.activePanelSub = this.panelService.sidePanelSub.subscribe((data) => {
      if (data) {
        this.defaultDisplay = 'end';
        this.defaultPadding = '0px';
      } else {
        this.defaultDisplay = 'center';
        this.defaultPadding = '190px';
      }
    });
    this.diligence.pipe(take(2)).subscribe((diligence) => {
      if (diligence) this.totalQuestion = diligence.question_count;
    });
    this.counterSub = this.totalCounter.subscribe((counter) => {
      if (counter) {
        let touchedQuestions = 0;
        let wipQuestions = 0;
        counter.count?.filter((val) => {
          if (val.id === 'AnsweredTotal') {
            touchedQuestions += val.value;
          }
          if (val.id === 'ToDoTotal') {
            wipQuestions += val.value;
          }
        });
        this.totalAnswer = touchedQuestions;
        this.wipTotal = wipQuestions;
        this.unAnsweredQuestion = this.totalQuestion - touchedQuestions;
      }
    });
    this.draftSub = this.draft.subscribe((draft) => {
      this.onlyCount = 0;
      if (draft) {
        let allQuestions = this.store.selectSnapshot(
          (state) => state.questionnaire.questions
        )[
          this.store.selectSnapshot(
            (state) => state.questionnaire.activeSection.id
          )
        ];
        this.questionsCount = 0;
        this.apiData = [];
        this.questionSet = new Set();
        Object.keys(draft).map((key) => {
          Object.values(draft[key]).map((api: any) => {
            this.apiData.push(JSON.parse(JSON.stringify(api)));
            this.onlyCount += 1;
            if (
              api.questionID in allQuestions &&
              !allQuestions[api.questionID]?.answer?.id
            ) {
              this.questionSet.add(api.questionID);
              this.questionsCount = this.questionSet.size;
            }
          });
        });
        if (this.questionsCount > this.totalQuestion)
          this.questionsCount = this.totalQuestion;
        this.progress =
          ((this.totalAnswer + this.wipTotal + this.questionsCount) /
            this.totalQuestion) *
          100;
        this.progress = this.progress > 100 ? 100 : this.progress;
        this.progress =
          this.progress % 10 === 0 ? this.progress : this.progress.toFixed(2);
      } else {
        this.progress = 0;
        this.apiData = [];
      }

      this.pendingDraft =
        this.totalQuestion - this.unAnsweredQuestion + this.questionsCount;
      if (this.pendingDraft >= this.totalQuestion)
        this.pendingDraft = this.totalQuestion;
    });
  }

  async handleDraftSave() {
    this.isDraftSaving = true;
    setTimeout(async () => {
      const { apiList, delNestedQuestionAct, triggerReview } =
        await this.draftService.updateDraftData(this.apiData, true);
      forkJoin(apiList).subscribe(
        async (res: any) => {
          // res may also contain bulkResolveComments API calls
          // so filter the res array with response_type property before passing to functions that only require responses data (since bulkResolveComments API doesn't return response_type)
          this.draftService.updateReviewNotes(
            res.filter((r) => r && r.response_type)
          );
          await forkJoin(
            delNestedQuestionAct.map((action) => this.store.dispatch(action))
          ).toPromise();
          this.draftService.getDraftDataForUpdatation(
            res.filter((r) => r && r.response_type),
            true
          );
          await this.store.dispatch(new GetTrackChanges()).toPromise();
          this.store.dispatch([
            new GetQuestionCount(),
            new UpdateDraftData(null, true),
          ]);
          if (triggerReview) {
            let activeSectionId = this.store.selectSnapshot(
              (state) => state.questionnaire.activeSection.id
            );
            let diligenceId = this.store.selectSnapshot(
              (state) => state.questionnaire.diligenceId
            );
            this.store.dispatch(
              new getReviewAssignments(diligenceId, activeSectionId)
            );
            this.status.destroyActiveEditorInstace();
          }
          this.isDraftSaving = false;
          this.apiData = [];
        },
        () => (this.isDraftSaving = false)
      );
      if (!apiList?.length) {
        // stop saving spinner if no updates to be done (can happen when save is clicked in an error state)
        this.isDraftSaving = false;
      }
    }, 500);
  }

  async handleSave() {
    this.isSaving = true;
    setTimeout(async () => {
      const { apiList, delNestedQuestionAct, triggerReview } =
        await this.draftService.updateDraftData(this.apiData, false);
      forkJoin(apiList).subscribe(
        async (res: any[]) => {
          // res may also contain bulkResolveComments API calls
          // so filter the res array with response_type property before passing to functions that only require responses data (since bulkResolveComments API doesn't return response_type)
          this.draftService.updateReviewNotes(
            res.filter((r) => r && r.response_type && r.id)
          );
          await forkJoin(
            delNestedQuestionAct.map((action) => this.store.dispatch(action))
          ).toPromise();
          this.draftService.getDraftDataForUpdatation(
            res.filter((r) => r && r.response_type)
          );
          await this.store.dispatch(new GetTrackChanges()).toPromise();
          this.store.dispatch([
            new GetQuestionCount(),
            new UpdateDraftData(null, true),
          ]);
          if (triggerReview) {
            let activeSectionId = this.store.selectSnapshot(
              (state) => state.questionnaire.activeSection.id
            );
            let diligenceId = this.store.selectSnapshot(
              (state) => state.questionnaire.diligenceId
            );
            this.store.dispatch(
              new getReviewAssignments(diligenceId, activeSectionId)
            );
          }
          this.isSaving = false;
          this.apiData = [];
        },
        () => (this.isSaving = false)
      );
      if (!apiList?.length) {
        // stop saving spinner if no updates to be done (can happen when save is clicked in an error state)
        this.isSaving = false;
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.draftSub.unsubscribe();
    this.counterSub.unsubscribe();
    this.activePanelSub?.unsubscribe();
  }
}
