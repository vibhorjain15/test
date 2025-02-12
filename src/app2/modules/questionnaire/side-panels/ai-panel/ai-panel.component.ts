import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { DropDownType } from 'src/app2/shared/components';
import { AiPrompts } from 'src/app2/shared/constants/constant';
import { QuestionAttributeType } from '../../types/questions.type';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { Store } from '@ngxs/store';

@Component({
  selector: 'ai-panel',
  templateUrl: './ai-panel.component.html',
  styleUrls: ['./ai-panel.component.css'],
})
export class AiPanelComponent implements OnInit, OnDestroy {
  @Input() selectedPrompt: DropDownType;
  @Input() question: QuestionAttributeType;
  @Input() isReadonly = false;
  @Input() selectedResponse: () => {
    selectedText: string;
    customSelection: boolean;
  };
  @Input() onClose: () => void;
  @Input() onAction: (action) => void;
  @Input() onGenerating: (generating) => void;
  @Input() onInit: () => void;

  diligence: DiligenceType;
  constructor(
    private readonly sidePanel: SidePanelService,
    private readonly store: Store
  ) {}

  ngOnInit() {
    this.onInit && this.onInit();
    this.diligence = this.store.selectSnapshot(
      (store) => store.questionnaire.diligence
    );
  }

  onSidePanelCancel() {
    this.sidePanel.close();
    this.onClose();
  }

  handleOnAction(event) {
    this.onAction(event);
  }

  ngOnDestroy(): void {
    this.onClose();
  }
}
