import { Component, OnInit, Input } from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import * as angular from 'angular';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { DueDiligenceDataService } from 'src/app2/services/duediligence-data-service';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { responseTypeList } from '../../template-builder/constants/responseType.constant';
import { HttpClient } from '@angular/common/http';

import { ParserApiService } from 'src/app2/apis/word-to-template/parser.service';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';
// import tinymce, { TinyMCE } from 'tinymce';
@Component({
  selector: 'manage-excel-template',
  templateUrl: './manage-excel-template.component.html',
  styleUrls: ['./manage-excel-template.component.css'],
})
export class ManageExcelTemplateComponent implements OnInit {
  @Input() selection: any;
  @Input() params: any;
  @Input() source: any; // QA or WP or EP
  activeTab = 'Question';
  current_firm: any;
  responseFromQa = { original: { sections: [] }, existing: { sections: [] } };
  documentHasDuplicates = false;
  activeView = 'original';
  originalContentFound = false;
  request: any = {};
  dd_params: any = {};
  finalData: any = {};
  document_data: any = {};
  isDiligenceCreation = false;
  template_params: any;
  requestTrackerParams: any;
  isWordParser = false;
  isQAflow = false;
  isQAProjectflow = false;
  responseTypes = [];
  excludedResponseTypes = [
    'aumTable',
    'DynamicGrid',
    'Grid',
    'CheckBox',
    'Dropdown',
    'Bookends',
    'NoPlus',
    'BooleanPlus',
    'ReturnTable',
  ];
  tinymceOptions: any;
  tinymceEditor: any;
  loading: boolean;
  originalResponse: any;
  vm: any = {
    title: '',
    firstButtonLabel: '',
  };
  setDropdownPositionToUp = false;
  constructor(
    private templatesDataService: TemplatesDataService,
    private Utils: UtilsService,
    private readonly toaster: ToastrService,
    private routerService: RouterService,
    private dueDiligenceDataService: DueDiligenceDataService,
    private customModalService: CustomModalService,
    private readonly http: HttpClient,
    private readonly datePipe: DatePipe, // private readonly tinyMceLocal: TinyMCE
    private parserService: ParserApiService,
    private readonly imageDataService: ImageDataService
  ) {}

  ngOnInit() {
    this.finalData = this.params;
    this.current_firm = this.Utils.getCurrentFirm();
    this.dd_params = this.templatesDataService.getDiligenceParams();
    this.template_params = this.templatesDataService.getTemplateParams();
    this.document_data = this.templatesDataService.getWordParserData();

    this.requestTrackerParams =
      this.templatesDataService.getRequestTrackerParams();
    this.templatesDataService
      .getResponseTypes()
      .toPromise()
      .then((responseTypes: any) => {
        this.responseTypes = responseTypes.filter(
          (resType) => this.excludedResponseTypes.indexOf(resType.text) == -1
        );
        this.setQuestionResponseType(responseTypes);
      });
    this.setResponseType();
    this.initTinyMCe();
    if (
      this.template_params.source &&
      this.template_params.source == 'InformationRequestFlow'
    ) {
      this.isDiligenceCreation = true;
    }
    if (this.source) {
      this.isWordParser = this.source == 'WP';
      this.isQAflow = this.source == 'QA';
      this.isQAProjectflow =
        this.source == 'QA' && this.template_params.is_new_project;
    }

    this.getTotal();
    this.setModalConfig();

    const WINDOW_ZOOM_THRESHOLD = 150;
    this.setDropdownPositionToUp =
      Math.round(window.devicePixelRatio * 100) >= WINDOW_ZOOM_THRESHOLD;
  }

  initTinyMCe() {
    this.tinymceOptions = {
      init_instance_callback: (editor) => {
        this.tinymceEditor = editor;
        editor.on('paste', (e) => {
          this.tinymceEditor.insertContent('');
        });
      },
      skin_url: './assets/stylesheets/tinymce/skins/tinymce-dv',
      browser_spellcheck: true,
      toolbar: false,
      menubar: false,
      statusbar: false,
      content_css: 'assets/stylesheets/tiny_mce_custom.css',
      forced_root_block: '',
      placeholder: 'Accepts multiline / paragraph text',
    };
  }

  setResponseType() {
    this.templatesDataService
      .getResponseTypes()
      .toPromise()
      .then((responseTypes: any) => {
        this.responseTypes = responseTypes.filter(
          (resType) => this.excludedResponseTypes.indexOf(resType.text) == -1
        );
        this.finalData.sections.forEach((section) => {
          section.isOpen = false;
          section.subSections.forEach((subSection) => {
            subSection.isOpen = false;
            subSection.questions.forEach((question) => {
              question.responseTypeDesc = responseTypeList.find(
                (x) => question.responseType === x.text
              ).description;
              if (question.text) {
                question.text = question.text.trim();
              }
            });
          });
        });
        if (
          this.finalData?.sections?.length > 0 &&
          this.finalData?.sections[0]?.subSections?.length > 0
        ) {
          this.finalData.sections[0].isOpen = true;
          this.finalData.sections[0].subSections[0].isOpen = true;
        }
      });
  }

  setQuestionResponseType(responseTypes) {
    this.finalData.sections.forEach((section) => {
      section.subSections.forEach((subSection) => {
        subSection.questions.forEach((question) => {
          question.responseTypeDesc = responseTypes.find(
            (x) => x.text === question.responseType
          ).description;
        });
      });
    });
  }

  setModalConfig() {
    if (this.isDiligenceCreation) {
      this.vm = {
        title: 'Create project from selection',
        firstButtonLabel: 'Create Project',
      };
    } else if (this.isQAflow) {
      this.vm = {
        title: 'Import Q/A Library Content from selection',
        firstButtonLabel: 'Import Q/A Content',
      };
    } else {
      this.vm.title = 'Create template from selection';
      this.vm.firstButtonLabel = 'Create Template';
    }
  }

  setActiveView(view: any) {
    this.activeView = view;
  }

  getTotal() {
    let total = 0;
    let array = this.getSelectedSection();
    array.forEach((section: any) => {
      section.subSections.forEach((subSection: any) => {
        subSection.questions.forEach((question: any) => {
          if (question.is_selected) {
            total += 1;
          }
        });
      });
    });
    return total;
  }

  getSelectedSection() {
    let sectionsArray = this.finalData?.sections || [];

    if (this.documentHasDuplicates) {
      sectionsArray = this.responseFromQa.original.sections;
    }

    if (this.activeView === 'duplicate') {
      sectionsArray = this.responseFromQa.existing.sections;
    }

    return sectionsArray || [];
  }

  sanitizeHTML(html: any) {
    html = new (window as any).tinymce.html.Serializer().serialize(
      new (window as any).tinymce.html.DomParser().parse(html)
    );
    return html;
  }

  getCount(section) {
    let count = 0;
    if (this.documentHasDuplicates) {
      section.subSections.forEach((subSection: any) => {
        subSection.questions.forEach((question: any) => {
          count += 1;
        });
      });
    } else {
      section.subSections.forEach((subSection: any) => {
        subSection.questions.forEach((question: any) => {
          if (question.is_selected) {
            count += 1;
          }
        });
      });
    }
    return count;
  }

  changeResponseType(type, question) {
    question.responseType = type.text;
    question.responseTypeDesc = type.description;
    question.responseTypeInt = type.id;
  }

  updateRequestandRedirect(response) {
    if (this.request && this.request.id) {
      this.request.duediligence_id = response.id;
      this.dueDiligenceDataService
        .saveRequest(this.request)
        .toPromise()
        .then((res) => {
          this.successHandler(response);
        });
    } else {
      this.successHandler(response);
    }
  }

  successHandler(response) {
    this.toaster.success('Your project is successfully created');
    this.customModalService.close();
    this.routerService.navigateWithParams(
      `app.diligence.project.questionnaire`,
      { diligenceId: response.id }
    );
  }

  createDiligence(request, params, pageUrl) {
    this.request = request;
    this.dueDiligenceDataService
      .createDiligence(params)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response) => {
        this.updateRequestandRedirect(response);
      });
  }

  createQaDiligence(params) {
    this.request = params;
    this.http
      .post(`service/excel_services/create_diligence_qa`, params)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((response: any) => {
        this.updateRequestandRedirect({ id: response.diligence_id });
      });
  }

  addDiligenceResponses(params: any) {
    this.http
      .post(`service/excel_services/add_responses`, params)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.templatesDataService.setDiligenceParams({});
        })
      )
      .subscribe((response: any) => {
        this.updateRequestandRedirect({ id: response.diligence_id });
      });
  }

  getOriginalQaParams() {
    let ogResCopy = angular.copy(this.originalResponse);
    let resFromQACopy = angular.copy(this.responseFromQa);
    const { Document_id, entity_id, entity_type, name } = ogResCopy;
    let params = {
      Document_id,
      entity_id,
      entity_type,
      name,
      sections: [],
    };
    params.sections = [];
    resFromQACopy.original.sections.forEach((section: any) => {
      section.subSections.forEach((subSection) => {
        subSection.questions = subSection.questions.filter(
          (entry) => entry.is_selected
        );
        if (subSection.questions.length) {
          subSection?.questions.forEach((question: any) => {
            question.override = true;
          });
          params.sections.push(section);
        }
      });
    });
    resFromQACopy.existing.sections.forEach((section: any) => {
      section.subSections.forEach((subSection) => {
        subSection.questions = subSection.questions.filter(
          (entry) => entry.is_selected
        );
        if (subSection.questions.length) {
          subSection?.questions.forEach((question: any) => {
            question.override = true;
          });
          params.sections.push(section);
        }
      });
    });
    return params;
  }

  loadCompareScreen() {
    let ogResCopy = angular.copy(this.originalResponse);
    let { Document_id, entity_id, entity_type, name } = ogResCopy;
    this.responseFromQa = {
      Document_id,
      entity_id,
      entity_type,
      name,
    } as any;
    this.responseFromQa.original = { sections: [] };
    this.responseFromQa.existing = { sections: [] };
    ogResCopy.sections.forEach((section: any) => {
      let newSection: any = angular.copy(section);
      newSection.subSections = [];
      section.subSections.forEach((subSection) => {
        subSection.questions = subSection.questions.filter(
          (entry: any) => !entry.is_duplicate
        );
        if (subSection.questions.length) {
          this.originalContentFound = true;
          newSection.subSections.push(subSection);
          subSection.isOpen = false;
        }
      });
      if (newSection.subSections.length) {
        this.responseFromQa.original.sections.push(newSection);
        newSection.isOpen = false;
      }
    });

    let ogResCopyForExisting = angular.copy(this.originalResponse);
    ogResCopyForExisting.sections.forEach((section: any) => {
      let newSection: any = angular.copy(section);
      newSection.subSections = [];
      section.subSections.forEach((subSection) => {
        subSection.questions = subSection.questions.filter(
          (entry: any) => entry.is_duplicate
        );
        if (subSection.questions.length) {
          newSection.subSections.push(subSection);
          subSection.questions.forEach((question) => {
            question.is_selected = false;
          });
          subSection.isOpen = false;
        }
      });
      if (newSection.subSections.length) {
        this.responseFromQa.existing.sections.push(newSection);
        newSection.isOpen = false;
      }
    });
    // To automatically open the first section and first subSection in preview modal
    if (
      this.responseFromQa.original?.sections?.length > 0 &&
      this.responseFromQa.original.sections[0]?.subSections?.length > 0
    ) {
      this.responseFromQa.original.sections[0].isOpen = true;
      this.responseFromQa.original.sections[0].subSections[0].isOpen = true;
    }
    // This is for the existing questions tab in QA flow preview modal
    if (
      this.responseFromQa.existing?.sections?.length > 0 &&
      this.responseFromQa.existing.sections[0]?.subSections?.length > 0
    ) {
      this.responseFromQa.existing.sections[0].isOpen = true;
      this.responseFromQa.existing.sections[0].subSections[0].isOpen = true;
    }
    return;
  }

  getResponseData(finalParams: any, response: any) {
    const questions = {};
    finalParams?.sections?.forEach((section: any) => {
      section?.subSections?.forEach((subSection: any) => {
        subSection?.questions?.forEach((question: any) => {
          questions[question['temp_id']] = question;
        });
      });
    });

    let respQuestionData = response?.questions?.map((question: any) => {
      return {
        temp_id: question['temp_id'],
        sub_section_id: question['sectionID'],
        id: question['id'],
        responseHTML: questions[question['temp_id']]['responseHTML'],
      };
    });

    return respQuestionData;
  }

  async save(close): Promise<void> {
    if (!this.finalData.name || this.finalData.name.length < 2) {
      this.toaster.error('Please enter a template name');
      return;
    }
    let finalParams: any = JSON.parse(JSON.stringify(this.finalData));
    const metadata = finalParams['metadata'];
    delete finalParams['metadata'];
    finalParams.sections.forEach((section: any) => {
      section.subSections.forEach((subSection: any) => {
        subSection.questions = subSection.questions.filter(
          (entry: any) => entry.is_selected
        );
      });
    });
    finalParams.type = this.template_params.type;
    let parserType = 'Excel';
    if (this.isWordParser) {
      parserType = 'Word';
      finalParams.parserType = 'Word';
    }

    let endpoint = `/excel_parser/create_template?parserType=${parserType}`;
    if (this.isQAflow && !this.isQAProjectflow) {
      if (this.documentHasDuplicates) {
        finalParams = this.getOriginalQaParams();
        if (finalParams.sections.length == 0) {
          this.toaster.error('Please select atleast one question');
          return;
        }
      }
      endpoint = '/service/excel_services/onboarding_word_qa_upload';
      finalParams.entity_id = this.template_params.selected_entity_id;
      finalParams.entity_type = this.template_params.selected_entity_type;
      if (this.template_params.responseDateStamp) {
        finalParams.sections.forEach((section: any) => {
          section.subSections.forEach((subSection: any) => {
            subSection.questions = subSection.questions.map((entry: any) => {
              entry = {
                ...entry,
                responseTimeStamp: this.template_params.responseDateStamp,
              };
              return entry;
            });
          });
        });
      }
    } else {
      finalParams['include_question_details'] = true;

      let teamPermissions: any =
        this.templatesDataService.getPermissionsParams();
      if (teamPermissions.teams && teamPermissions.teams.length > 0) {
        finalParams.permissions = [];
        teamPermissions.teams.each((team) => {
          if (team.team && team.access) {
            finalParams.permissions.push({
              assigned_to_entity_type: 'Team',
              assigned_to_entity_id: team.team,
              access_level: team.access,
              entity_type: keywordConstants.Template,
            });
          }
        });
      }
    }
    this.loading = true;

    // Save all the base64 images that are parsed from the document.
    await this.asyncUploadBase64Images(finalParams);

    this.http
      .post(endpoint, finalParams)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((templateReponse: any) => {
        if (this.isWordParser || this.isQAflow) {
          this.parserService
            .saveMetadata({
              document_id: this.document_data?.doc_id,
              metadata: metadata,
            })
            .subscribe(() => {});
        }
        if (this.isDiligenceCreation) {
          this.dd_params.apiParams.template_id = templateReponse.template_id;
          let params: any = {
            diligence_type: this.dd_params.apiParams.duediligence_type,
            entities: [
              {
                id: this.dd_params.apiParams.entity_id,
                entity_type: this.dd_params.apiParams.entity_type,
                template_id: this.dd_params.apiParams.template_id,
              },
            ],
            name: this.dd_params.apiParams.name,
            due_at: this.datePipe.transform(
              this.dd_params.apiParams.due_at,
              'MM-dd-yyyy'
            ),
            as_of_date: this.datePipe.transform(
              this.dd_params.apiParams.as_of_date,
              'MM-dd-yyyy'
            ),
            is_internal: true,
          };
          if (this.dd_params.apiParams.investor_id) {
            params.investor_id = this.dd_params.apiParams.investor_id;
          }
          this.createDiligence(
            this.dd_params.apiParams,
            params,
            this.dd_params.pageUrl
          )
            // .pipe(
            //   finalize(() => {
            //     if (!this.isWordParser) {
            //       this.loading = false;
            //       this.templatesDataService.setDiligenceParams({});
            //     }
            //   })
            // )
            // .subscribe((res: any) => {
            //   if (this.isWordParser) {
            //     this.addDiligenceResponses({
            //       diligence_id: res.id,
            //       questions: this.getResponseData(finalParams, templateReponse),
            //     });
            //   } else {
            //     this.updateRequestandRedirect({
            //       id: res.id,
            //     });
            //   }
            // });
        } else if (this.isQAProjectflow) {
          const params = {
            template_id: templateReponse.template_id,
            name: this.dd_params.apiParams.name,
            diligence_type: this.dd_params.apiParams.duediligence_type,
            entity_type: this.dd_params.apiParams.entity_type,
            entity_id: this.dd_params.apiParams.entity_id,
            due_at: this.datePipe.transform(
              this.dd_params.apiParams.due_at,
              'MM-dd-yyyy'
            ),
            as_of_date: this.datePipe.transform(
              this.dd_params.apiParams.as_of_date,
              'MM-dd-yyyy'
            ),
            response_date: this.datePipe.transform(
              this.template_params.responseDateStamp,
              'MM-dd-yyyy'
            ),
            is_internal: true,
            questions: this.getResponseData(finalParams, templateReponse),
          };

          this.createQaDiligence(params);
          this.templatesDataService.setDiligenceParams({});
        } else if (this.isQAflow) {
          if (templateReponse.has_error) {
            this.documentHasDuplicates = true;
            this.originalResponse = templateReponse;
            this.loading = false;
            this.loadCompareScreen();
            this.setActiveView(this.activeView);
            return;
          } else {
            let message =
              'Your content upload is in-progress and may take up to 5 minutes to add the finishing touch. You will receive an email once the content is uploaded.';
            this.toaster.success(message);
            this.routerService.navigate(`app.content.questions`);
          }
        } else {
          this.routerService.navigateWithParams(
            'app.diligence.template.preview',
            { templateId: templateReponse.template_id }
          );
        }
        close();
      });
  }

  /**
   * Parse the base64 images from responses and uploads them to server.
   * @param params The `params` which has nested sections, subSections and questions.
   * @usageNotes
   * ```
   * const params = {
   *  sections: Array<{
   *    ...
   *    subSections: Array<{
   *      ...
   *      questions: {
   *        ...
   *        responseHTML: string;
   *      },
   *    }>,
   *  }>,
   * };
   * ```
   */
  private async asyncUploadBase64Images(params: any): Promise<void> {
    let questions = [];
    params.sections.forEach((section: any) => {
      section.subSections.forEach((subSection: any) => {
        subSection.questions.forEach((question: any) => {
          questions.push(question);
        });
      });
    });

    let count = 1;
    for (const question of questions) {
      question.responseHTML =
        await this.imageDataService.asyncReplaceBase64Images(
          question.responseHTML
        );
      count++;
    }
  }
}
