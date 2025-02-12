import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { AutoFill, TabType } from '../../types/auto-fill.type';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'autofill-preview',
  templateUrl: './autofill-preview.component.html',
  styleUrls: ['./autofill-preview.component.css'],
})
export class AutofillPreviewComponent {
  @Input() diligence: DiligenceType;
  @Input() selectedButton: AutoFill;
  @Input() selectedTab: TabType;
  @Input() previewData: any;
  @Input() selectedEntity: number;
  @Input() selectedProject: number;
  @Input() loading: boolean;
  @Input() showMatchText: boolean;
  @Input() fromType: 'es' | 'db' = 'es'; // As this component is common for both db as es autofill
  @Output() onAutoFillPreviewClick: EventEmitter<any> = new EventEmitter();
  AutoFill = AutoFill;
  showText: boolean = true;
  constructor(private readonly toaster: ToastrService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.previewData && changes.previewData.currentValue) {
      this.previewData.percentage =
        this.previewData.unanswered_questions_count > 0
          ? (
              ((this.previewData.potential_autofill.exact_matches +
                this.previewData.potential_autofill.similar_matches) /
                this.previewData.unanswered_questions_count) *
              100
            ).toFixed(2)
          : '0.00';
      this.loading = false;
      this.showText = false;
    }
    if (
      (changes?.selectedButton && changes.selectedButton.currentValue) ||
      (changes?.selectedTab && changes.selectedTab.currentValue)
    ) {
      this.loading = false;
      this.showText = true;
    }
    if (changes?.loading && changes.loading.currentValue) {
      this.showText = false;
    }
  }

  getAutoFillPreview(type) {
    if (type === 'hide') {
      this.showText = !this.showText;
      return;
    }
    if (!this.validateData()) {
      return false;
    }
    this.onAutoFillPreviewClick.emit();
  }

  getConditionalResponsesText(previewCount): string {
    if (!previewCount.nested_count) {
      return '';
    }
    if (previewCount.nested_count === 1) {
      return `(${previewCount.nested_count} is a conditional response)`;
    }
    return `(${previewCount.nested_count} are conditional responses)`;
  }

  validateData() {
    if (
      this.selectedTab === TabType.Standard &&
      this.selectedButton !== AutoFill.Most_Recent &&
      this.selectedButton !== AutoFill.From_Mapped_Responses
    ) {
      if (
        this.selectedButton === AutoFill.From_Diligence_Project &&
        !this.selectedProject
      ) {
        this.toaster.error('Please select a project');
        return false;
      }
      if (
        this.selectedButton !== AutoFill.From_Diligence_Project &&
        !this.selectedEntity
      ) {
        this.toaster.error('Please select an entity');
        return false;
      }
    }
    return true;
  }
}
