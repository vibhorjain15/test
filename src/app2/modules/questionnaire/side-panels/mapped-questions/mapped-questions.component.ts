import {
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import {
  ResponseStatus,
  TrackChangeStatus,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { ResponseType } from '../../constants/Response-type.constant';
import { UpdateAttachmentMap } from '../../store/questionnaire.action';
import { UpdateLocalQuestionState } from '../../store/questionnaire.util';
import {
  MappedQuestion,
  ReviewMappingsData,
} from '../../types/review-mappings-data.type';
import { copyHtml } from '../../util/copy-html.util';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'mapped-questions',
  templateUrl: './mapped-questions.component.html',
  styleUrls: ['./mapped-questions.component.css'],
})
export class MappedQuestionsComponent implements OnInit {
  qa;
  filteredQa;
  isLoading: boolean;
  metaClass = ['meta-info'];
  showCopyAllResponsesButton: boolean = false;

  @Input() question: QuestionType;
  @Input() diligence: DiligenceType;
  @Input() isAddToResponseAllowed: boolean = false;
  @Input() reviewMappingsData: ReviewMappingsData;
  @Input() handleAddResponse;
  mappedQuestions: MappedQuestion[];
  mappedDiligenceIds: number[];
  mappedResponses: any[];
  htmlRenderTypes = [
    ResponseType.Attachment,
    ResponseType.ReturnTable,
    ResponseType.aumTable,
    ResponseType.Grid,
    ResponseType.DynamicGrid,
    ResponseType.BooleanPlus,
    ResponseType.NoPlus,
    ResponseType.CheckBox,
  ];
  copyUnsupportedResponseTypes = [
    ResponseType.Attachment,
    ResponseType.ReturnTable,
    ResponseType.aumTable,
  ];
  copyIcon = { name: 'copy' };
  addResponseIcon = { name: 'plus' };
  responseType = ResponseType;

  @ViewChildren('response', { read: ElementRef })
  responseComponents: QueryList<ElementRef>;

  @ViewChildren('copyGrid', { read: ElementRef })
  copyGridComponents: QueryList<ElementRef>;

  constructor(
    private readonly panel: SidePanelService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly dvDatePipe: DvDatePipe,
    private readonly clipboard: ClipboardService,
    private readonly toaster: ToastrService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.mappedDiligenceIds = this.reviewMappingsData.mapped_diligences.map(
      (mappedDiligence) => mappedDiligence.id
    );
    this.mappedQuestions = [];
    this.reviewMappingsData.question_mappings
      .filter(
        (questionMapping) =>
          questionMapping.question_group_id === this.question.group_id
      )
      .forEach((questionMapping) => {
        this.mappedQuestions.push(...questionMapping.mapped_questions);
      });
    this.questionnaireService
      .getMappedQuestionResponses({
        mapped_question_ids: this.mappedQuestions.map(
          (question) => question.mapped_question_id
        ),
        mapped_diligence_ids: this.mappedDiligenceIds,
      })
      .subscribe((data) => {
        this.mappedResponses = [];
        this.mappedQuestions.forEach((mappedQuestion) => {
          (data as any[])
            .filter(
              (mappedResponse) =>
                mappedResponse.question_group_id ===
                  mappedQuestion.question_group_id &&
                mappedResponse.template_id === mappedQuestion.template_id
            )
            .forEach((mappedResponse) => {
              let formattedResponse = this.formatMappedResponse(
                mappedQuestion,
                mappedResponse
              );
              this.mappedResponses.push(formattedResponse);
              this.showCopyAllResponsesButton =
                this.showCopyAllResponsesButton || formattedResponse.allowCopy;
            });
        });

        this.isLoading = false;
      });
  }

  formatMappedResponse(mappedQuestion, mappedResponse) {
    let attachmentMap = {};
    let diligence = this.reviewMappingsData.mapped_diligences.find(
      (item) => item.id === mappedResponse.duediligence_id
    );
    let response: any = {
      questionText: mappedQuestion.mapped_question_text,
      templateName: diligence.template_name,
      projectName: diligence.name,
      entityName: diligence.entity_name,
      attachments: mappedResponse.attachments ?? undefined,
      allowCopy:
        !mappedResponse.is_NA &&
        !this.copyUnsupportedResponseTypes.includes(
          mappedResponse.response_type
        ),
      isHtmlCopyRequired:
        !mappedResponse.is_NA &&
        (mappedResponse.response_type == ResponseType.Grid ||
          mappedResponse.response_type == ResponseType.DynamicGrid),
      answer: {
        attributes: {
          ...mappedResponse,
          is_WIP: false,
          is_validation_required: false,
          response_status: ResponseStatus.STARTED,
          track_change_status: TrackChangeStatus.STARTED,
          responseType: mappedResponse.response_type,
          id: mappedResponse.id,
        },
        id: mappedResponse.id,
      },
      grid_id: mappedResponse.grid_id,
      grid_version: mappedResponse.grid_version,
      id: mappedResponse.questionID,
      responseType: mappedResponse.response_type,
      showComment: ![
        ResponseType.TextEmail,
        ResponseType.Text,
        ResponseType.TextMultiLine,
      ].includes(mappedResponse.response_type),
      url: this.getUrl(mappedResponse, diligence),
    };

    switch (response.responseType) {
      case ResponseType.Attachment:
        response?.attachments?.forEach(
          (attachment) => (attachmentMap[attachment.id] = attachment)
        );
        break;
    }

    UpdateLocalQuestionState(response.answer, this.dvDatePipe);
    this.store.dispatch(new UpdateAttachmentMap(attachmentMap));
    return response;
  }

  onCancelClick() {
    this.panel.close();
  }

  addAllResponses() {
    let response = '';
    this.mappedResponses.forEach((mappedResponse) => {
      let currentResponse = this.getResponse(mappedResponse);
      if (currentResponse?.length > 0) {
        response += currentResponse + '\n';
      }
    });
    if (this.isAddToResponseAllowed) {
      this.handleAddResponse(response);
    } else {
      copyHtml(response, this.clipboard, this.toaster);
    }
  }

  addOrCopyResponse(mappedResponse) {
    if (!mappedResponse.allowCopy) return;
    let response = this.getResponse(mappedResponse);
    if (!this.isAddToResponseAllowed) {
      if (response?.length > 0) {
        copyHtml(response, this.clipboard, this.toaster);
      }
    } else {
      this.handleAddResponse(response ?? '');
    }
  }

  getResponse(mappedResponse) {
    let response = '';
    if (mappedResponse.isHtmlCopyRequired) {
      let responseComponent = this.getGridElement(
        mappedResponse?.id?.toString(),
        mappedResponse?.answer?.id?.toString()
      );
      response = responseComponent.nativeElement?.innerHTML;
    } else {
      response = mappedResponse.answer.attributes.responseDisplay;
      response =
        response
          ?.replace(/<br>/g, '\n')
          ?.replace(/<\/br>/g, '\n')
          ?.replace(/<br\/>/g, '\n')
          ?.replace(/<br \/>/g, '\n') ?? '';
    }
    return response;
  }

  getGridElement(questionId, answerId) {
    return this.isAddToResponseAllowed
      ? this.responseComponents.find(
          (component) =>
            component?.nativeElement?.attributes?.questionId?.value ==
              questionId &&
            component?.nativeElement?.attributes?.responseId?.value == answerId
        )
      : this.copyGridComponents.find(
          (component) =>
            component?.nativeElement?.attributes?.questionId?.value ==
              questionId &&
            component?.nativeElement?.attributes?.responseId?.value == answerId
        );
  }

  getUrl(response: any, diligence: any): string {
    const entityType = diligence.entity_type.toLowerCase();
    const parentState = '/#/app/diligence';
    let newState: string = '';
    const childState = `/projects/${response.duediligence_id}/questionnaire/category/${response.parentSectionId}/question/${response.questionID}#child_section_${response.sectionId}`;
    if (entityType === keywordConstants.Product.toLowerCase()) {
      newState = `/${diligence.fromfirm_id}/firms/${diligence.tofirm_id}/funds/${diligence.entity_id}`;
    } else if (entityType === keywordConstants.Firm.toLowerCase()) {
      newState = `/${diligence.fromfirm_id}/firms/${diligence.tofirm_id}`;
    } else if (entityType === keywordConstants.Strategy.toLowerCase()) {
      newState = `/${diligence.fromfirm_id}/firms/${diligence.tofirm_id}/strategies/${diligence.entity_id}`;
    }

    return `${parentState}${newState}${childState}`;
  }

  closePanel() {
    this.panel.close();
  }
}
