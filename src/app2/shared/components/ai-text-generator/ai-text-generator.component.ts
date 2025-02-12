import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DropDownType } from '../dv-dropdown/dv-dropdown.component';
import { ToastrService } from 'ngx-toastr';
import { AiPrompts } from '../../constants/constant';
import { QuestionAttributeType } from 'src/app2/modules/questionnaire/types/questions.type';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from 'src/app2/services/utils.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import {
  getEditableResponsePrompts,
  getReadonlyResponsePrompts,
} from './ai-dropdown.constants';
import { copyHtml } from 'src/app2/modules/questionnaire/util/copy-html.util';
import { ClipboardService } from 'ngx-clipboard';
import { finalize } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'ai-text-generator',
  templateUrl: './ai-text-generator.component.html',
  styleUrls: ['./ai-text-generator.component.css'],
})
export class AiTextGeneratorComponent implements OnInit, OnDestroy {
  @Input() selectedPrompt: DropDownType;
  @Input() selectedResponse: () => {
    selectedText: string; // Selected text
    customSelection: boolean; // to know wether its a custom selection or not
  }; // This will be a function to fetch the latest response in the editor
  @Input() isReadonly = false;
  @Input() question: QuestionAttributeType;
  @Input() diligence: DiligenceType;
  @Output() onAction: EventEmitter<any> = new EventEmitter();
  @Output() onGenerating: EventEmitter<any> = new EventEmitter();
  @ViewChild('dropdownLabel') dropdownLabel: ElementRef;

  generatedResponse = '';
  generated = false;
  showGenerateButton: boolean = true;
  copied: boolean;
  AiPrompts = AiPrompts;
  latestSelectedText: any = {};
  customAIText: string;
  generating: boolean = false;
  loaderApi: boolean = false;
  isDropDownOpen: boolean = false;
  showActionButtons: boolean = true;
  applyToGenerated: boolean = true;
  dropdownList: DropDownType[];
  is_manager: boolean;
  generatedOnce: boolean;
  intervalId;
  addingText: boolean = false;
  compareMode: boolean = false;
  systemGenerated: boolean = false;
  generatedCount: number;
  generatedResponseId: number;
  feedbackSelected;
  AiTc;
  constructor(
    private readonly toaster: ToastrService,
    private http: HttpClient,
    private readonly utils: UtilsService,
    private readonly clipboard: ClipboardService,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    // If the project is external and the user is investor send the summarize prompt for investor
    if (!this.isReadonly)
      this.dropdownList = getEditableResponsePrompts(null, 10000) as any[];
    else this.dropdownList = getReadonlyResponsePrompts();
    if (
      !this.diligence.is_internal &&
      this.utils.isInvestor() &&
      this.isReadonly
    ) {
      this.dropdownList.find((obj) => obj.key === AiPrompts.Summarize).key =
        AiPrompts.SummarizeInvestor;
    }
    if (
      this.selectedResponse()?.selectedText &&
      this.selectedPrompt &&
      this.selectedPrompt.key !== AiPrompts.Custom
    ) {
      this.generateResponse();
    } else if (
      !this.selectedPrompt ||
      this.selectedPrompt.key === AiPrompts.Custom
    )
      this.generatedResponse = 'Please select a prompt from below.';

    this.AiTc = this.routerService.href('app.ai-terms-of-use', {});
    this.is_manager = this.utils.isManager();
  }

  showLabelTooltip() {
    if (!this.dropdownLabel?.nativeElement) return;
    return (
      this.dropdownLabel?.nativeElement?.offsetWidth <
      this.dropdownLabel?.nativeElement?.scrollWidth
    );
  }
  onDropdownToggle(data) {
    this.isDropDownOpen = data;
  }

  handlePromptSelected(data) {
    this.generated = false;
    this.selectedPrompt = data;
    this.showGenerateButton = true;
    this.isDropDownOpen = false;
    this.customAIText = null;
  }

  generateResponse() {
    let maxWordCount =
      this.selectedPrompt.key.split(' ')[0] === 'Trim'
        ? Number.isNaN(+this.selectedPrompt.key.split(' ')[4])
          ? null
          : +this.selectedPrompt.key.split(' ')[4]
        : null;

    this.latestSelectedText = this.selectedResponse();

    if (
      !(this.applyToGenerated && this.generatedOnce
        ? this.generatedResponse
        : this.latestSelectedText?.selectedText)
    ) {
      this.toaster.info('Please add a response');
      return;
    }

    maxWordCount = this.question.response_word_limit
      ? Math.min(maxWordCount ?? 100000, this.question.response_word_limit)
      : maxWordCount;
    let aiParams = {
      max_output_words: !this.isReadonly ? maxWordCount : null,
      custom_prompt: this.selectedPrompt.key === AiPrompts.Custom,
      question_id: this.question.id,
      response_id: this.question?.answer?.id,
      question_text:
        !this.latestSelectedText?.customSelection || this.isReadonly
          ? this.question.text
          : '',
      response_text:
        this.applyToGenerated && this.generatedOnce
          ? this.generatedResponse
          : this.utils.stripCommentsAndTrackChanges(
              this.latestSelectedText?.selectedText
            ),
      prompt:
        this.selectedPrompt.key === AiPrompts.Custom
          ? this.customAIText.trim()
          : this.selectedPrompt.key,
      section_id: this.question.sectionID,
      diligence_id: this.diligence?.id,
      sequence_id:
        Number(this.question.sequenceID) < 1 ? null : this.question.sequenceID, // Determine if the sequence id is manually generated on FE or not
    };
    if (!aiParams.response_text) return;

    this.generating = true;
    this.onGenerating?.emit(true);
    this.loaderApi = true;
    this.feedbackSelected = null;
    this.compareMode = false;
    this.http
      .post('/service/es_service/prompt_response', aiParams)
      .pipe(
        finalize(() => {
          this.loaderApi = false;
        })
      )
      .subscribe(
        (response: any) => {
          let responseObj =
            response && JSON.parse(response).ai_generated_reponse;

          if (!responseObj) {
            this.generating = false;
            this.onGenerating?.emit(false);
            this.loaderApi = false;
            this.compareMode = false;
            return;
          }

          this.generatedResponseId = JSON.parse(response).ai_response_id;
          this.addingText = true;
          if (responseObj.includes('AutomatedDVMessage:')) {
            this.systemGenerated = true;
            responseObj = responseObj.replace('AutomatedDVMessage:', '');
          } else this.systemGenerated = false;
          let i = 0;
          this.loaderApi = false;
          this.intervalId = setInterval(() => {
            this.generatedResponse = responseObj.slice(0, i);
            i++;
            if (i > responseObj.length) {
              this.clearIntervalAndCleanUp();
            }
          }, 4);
        },
        (error) => {
          this.clearIntervalAndCleanUp(true);
        }
      );
  }

  onCopyText() {
    copyHtml(this.generatedResponse, this.clipboard, this.toaster);
    this.copied = true;
  }

  handleAction(type) {
    let op = {
      type: type,
      value: this.generatedResponse,
    };
    this.onAction.emit(op);
  }

  handleGenerate() {
    this.generateResponse();
  }

  handleGenerateStop(stop = false) {
    if (stop) {
      this.clearIntervalAndCleanUp(true);
    } else {
      this.generateResponse();
    }
  }

  handleCompare() {
    this.compareMode = !this.compareMode;
  }

  clearIntervalAndCleanUp(error = false) {
    this.intervalId && clearInterval(this.intervalId);
    this.generating = false;
    this.onGenerating?.emit(false);
    this.generatedOnce = this.generatedOnce || (!error && true);
    this.showGenerateButton = false;
    this.addingText = false;
    this.generated = !error && true;
    this.copied = false;
    this.generatedCount = this.utils.tinymceGetWordCount(
      this.generatedResponse
    );
  }

  feedback(type: 'bad' | 'good') {
    this.feedbackSelected = type;
    this.http
      .patch(`airesponses/${this.generatedResponseId}`, {
        helpful: type !== 'bad',
      })
      .subscribe((test) => {
        this.toaster.success('Thank you for your feedback');
      });
  }

  ngOnDestroy(): void {
    this.intervalId && clearInterval(this.intervalId);
  }
}
