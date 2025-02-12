import {
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
} from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { QaBankComponent } from '../modules/questionnaire/components';
import {
  ReviewStatusComponent,
  TodosComponent,
  ViewRulesComponent,
  CkCommentsPanelComponent,
} from '../modules/questionnaire/side-panels';
import { MappedQuestionsComponent } from '../modules/questionnaire/side-panels';
import {
  FollowUpPanelComponent,
  NewWorkflowComponent,
  QaRevisionComponent,
  SuggestedResponsesComponent,
} from '../modules/questionnaire/side-panels';
import {
  RecommendationPanelComponent,
  NewRecommendaitonPanelComponent,
} from '../modules/recommendation/components';
import {
  ConfigureNestedLogicComponent,
  ConfigureQuestionMappingComponent,
  EditQuestionModalComponent,
  SetSmartTextComponent,
} from '../modules/template-builder/side-panels';
import { InternalNotesComponent } from '../shared/sidepanels/internal-notes/internal-notes.component';
import { AiPanelComponent } from '../modules/questionnaire/side-panels/ai-panel/ai-panel.component';

type sidePanel =
  | 'edit-question-panel'
  | 'configure-question-mapping'
  | 'configure-nested-logic'
  | 'set-smart-text'
  | 'recommendation-panel'
  | 'follow-up-panel'
  | 'new-recommendation-panel'
  | 'qa-bank'
  | 'suggested-responses'
  | 'internal-notes'
  | 'qa-revision'
  | 'new-workflow'
  | 'questionnaire-todo'
  | 'review-status'
  | 'view-rules'
  | 'mapped-questions'
  | 'review-status'
  | 'ck-comments-panel'
  | 'ai-panel'
  | 'review-status';
@Injectable({
  providedIn: 'root',
})
export class SidePanelService {
  componentRef: ComponentRef<any>;
  container;

  sidePanelSub: Subject<boolean> = new Subject();
  containerSub: Subject<any> = new Subject();
  sidePanelState: 'open' | 'closed' = 'closed';
  activePanelName: string;

  constructor(private resolver: ComponentFactoryResolver) {}

  private sidePanelMapper = new Map<sidePanel, any>([
    ['edit-question-panel', EditQuestionModalComponent],
    ['configure-question-mapping', ConfigureQuestionMappingComponent],
    ['set-smart-text', SetSmartTextComponent],
    ['configure-nested-logic', ConfigureNestedLogicComponent],
    ['recommendation-panel', RecommendationPanelComponent],
    ['follow-up-panel', FollowUpPanelComponent],
    ['new-recommendation-panel', NewRecommendaitonPanelComponent],
    ['qa-bank', QaBankComponent],
    ['suggested-responses', SuggestedResponsesComponent],
    ['internal-notes', InternalNotesComponent],
    ['qa-revision', QaRevisionComponent],
    ['new-workflow', NewWorkflowComponent],
    ['questionnaire-todo', TodosComponent],
    ['mapped-questions', MappedQuestionsComponent],
    ['review-status', ReviewStatusComponent],
    ['view-rules', ViewRulesComponent],
    ['ck-comments-panel', CkCommentsPanelComponent],
    ['ai-panel', AiPanelComponent],
  ]);
  setContainerRef(container) {
    this.container = container;
    this.containerSub.next(this.container);
  }

  close() {
    this.container?.clear();
    this.componentRef?.destroy();
    this.sidePanelSub?.next(false);
    this.sidePanelState = 'closed';
    this.activePanelName = null;
  }

  invoke(panelName, inputs = {}, container = document.body) {
    this.sidePanelState = 'open';
    this.activePanelName = panelName;
    this.sidePanelSub.next(true);
    this.containerSub.pipe(take(2)).subscribe((container) => {
      if (container) {
        this.container?.clear();
        const factory: ComponentFactory<any> =
          this.resolver.resolveComponentFactory(
            this.sidePanelMapper.get(panelName)
          );
        this.componentRef = this.container.createComponent(factory);
        let keys = Object.keys(inputs);
        keys.forEach((key) => {
          this.componentRef.instance[key] = inputs[key];
        });
      }
    });
  }
}
