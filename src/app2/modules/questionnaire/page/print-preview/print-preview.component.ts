import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { UserState } from 'src/app2/store/user/user.state';
import { allFiltersMap } from '../../constants/quick-view-headers.constant';
import {
  GetDiligenceData,
  GetDiligenceSectionData,
  GetMyFunctions,
  GetQuestionCount,
  UpdateFilterMap,
  UpdateIds,
} from '../../store/questionnaire.action';
import { StateDiligenceUpdateType } from '../../store/questionnaire.modal';
import { QuestionState } from '../../store/questionnaire.state';

import { QuestionAttributeType } from '../../types/questions.type';
import { CacheUtil } from '../../service/cache.service';

@Component({
  selector: 'print-preview',
  templateUrl: './print-preview.component.html',
  styleUrls: ['./print-preview.component.css'],
})
export class PrintPreviewComponent implements OnInit, OnDestroy {
  questions: QuestionAttributeType[] = [];
  diligenceData: DiligenceType & StateDiligenceUpdateType;
  loading;
  category;
  filter = 'default';
  subCatTitle;
  answeredCount;
  unansweredCount;

  @Select(QuestionState.getDiligence) diligence;
  @Select(UserState.getCurrentUserData) user;
  @ViewChild('outlet', { read: ViewContainerRef }) outletRef: ViewContainerRef;
  @ViewChild('content', { read: TemplateRef }) contentRef: TemplateRef<any>;

  constructor(
    private readonly store: Store,
    private readonly router: RouterService,
    private cache: CacheUtil
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.store.dispatch(new UpdateIds(this.router.getState().params));
    this.store.dispatch(new GetQuestionCount()).subscribe((val) => {
      this.store.dispatch(new GetDiligenceData()).subscribe((data) => {
        this.diligenceData = data.questionnaire.diligence;
        this.store.dispatch(
          new GetMyFunctions(data.questionnaire.diligence.id)
        );
        this.store.dispatch(new GetDiligenceSectionData()).subscribe((res) => {
          let cat = Object.values(
            JSON.parse(JSON.stringify(res.questionnaire.categories))
          );
          cat.sort(
            (a: any, b: any) => a.destination_index - b.destination_index
          );
          this.category = cat.map((val: any) => {
            let list = Object.values(val.list);
            list.sort(
              (a: any, b: any) => a.destination_index - b.destination_index
            );
            val.list = list;
            return val;
          });
          this.loading = false;
          this.store.selectSnapshot((state) => {
            this.filter = state.questionnaire.filterStatus;
            this.answeredCount = state.questionnaire.questionCounts[1].value;
            this.unansweredCount = state.questionnaire.questionCounts[2].value;
          });
        });
      });
    });
  }

  getValues(obj) {
    return Object.values(obj);
  }

  public rerender() {
    this.outletRef.clear();
    this.outletRef.createEmbeddedView(this.contentRef);
  }

  handleFilter(type) {
    if (this.filter === allFiltersMap[type].param) this.filter = 'default';
    else this.filter = allFiltersMap[type].param;
    this.store.dispatch(new UpdateFilterMap(this.filter));
    this.rerender();
  }

  handlePrint() {
    window.print();
  }

  handleBack() {
    const currRoute = this.router.getState()._routerState.url;
    this.router.navigate(
      currRoute.split('print_preview')[0] + '/questionnaire'
    );
  }
  ngOnDestroy(): void {
    this.cache.clearCache();
  }
}
