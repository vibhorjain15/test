import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { TemplateState } from '../../store/template-builder.state';
import { frequency } from '../../constants/frequency';
import { filter, finalize, take } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { RouterService } from 'src/app2/services/router.service';
import { UserState } from 'src/app2/store/user/user.state';
import {
  ActivateTemplate,
  GetTemplateInfo,
  UpdateActivePanelId,
  UpdateActiveSectionId,
  UpdateRouteParams,
  UpdateTemplate,
} from '../../store/template-builder.action';
import { ToastrService } from 'ngx-toastr';
import { TemplateType } from 'src/app2/apis/template/types/template.type';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { saveAs } from 'file-saver';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';
import { handelConflict } from '../../store/template-builder.util';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'dv-template-header-wrapper',
  templateUrl: './dv-template-header-wrapper.component.html',
  styleUrls: ['./dv-template-header-wrapper.component.css'],
})
export class DvTemplateHeaderWrapperComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  title: string = 'Test header component';
  subtitle: string = 'Sample Subtitle header';
  @ViewChild('sampleref') dvDropDownMore: ElementRef;
  private destroy: Subject<boolean> = new Subject<boolean>();
  private routerSub;

  @Select(TemplateState.getQuestionLoading) questionLoading: Observable<any>;
  @Select(TemplateState.getTemplateInfo) templateInfo: any;
  @Select(UserState.getCurrentUserData) user;

  toggleMoreDropDown: boolean = false;
  templateStatus: string = '';
  frequencyTemp: string = 'None';
  tagType: string;
  documentType: string = '';
  currentUrl: string[];
  isInvestor = false;
  isManager = false;
  templateData: TemplateType;
  templateType: string;
  totalQuestion: number;
  //4 different pages hence 4 different modes
  currentMode: 'preview' | 'score' | 'edit' | 'print' = 'edit';
  width: number = 500; // default width of header icons on the right part
  previewMoreList = [];
  editMoreList = [];
  commonList = [
    {
      label: 'Add Internal Notes',
      key: 'notepad',
      name: 'notepad',
      tooltip: 'Add internal notes',
    },
    {
      label: 'Download in Excel',
      key: 'download3',
      name: 'download3',
      tooltip: 'Download template as Excel',
    },
    {
      label: 'Delete Template',
      key: 'trashcan',
      name: 'trashcan',
      tooltip: 'Delete this template',
    },
  ];

  moreList;
  RequestButtonLabel = 'Start New Request';
  RequestButtonTooltip = 'Start new request';
  previewLabelTooltip = '';
  @Select(TemplateState.getQuestionData) questionState;
  isLoaded = false;
  isLoading = false;
  isCatRoute = false;
  previousUrl: string;
  constructor(
    private readonly store: Store,
    private readonly modal: CustomModalService,
    private routerService: RouterService,
    private readonly template: TemplateService,
    private readonly toastService: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private templateDataService: TemplateDataService,
    private panelService: SidePanelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.canRoute(document.location.href);
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.isInvestor = user.isInvestor;
          this.isManager = user.isManager;
          this.getTemplateDetails();
        }
      });
  }

  getTemplateDetails() {
    this.destroy = this.templateInfo.subscribe((template) => {
      if (template.template) {
        if (template.template.templateInfo.is_draft === true) {
          this.templateStatus = 'Draft';
          this.tagType = 'inProgress';
        } else {
          this.templateStatus = 'Active';
          this.tagType = 'default';
        }
        let index = this.commonList.some((ele) => ele.key === 'clone');
        if (template.template.templateInfo.type !== 'dd_profile' && !index)
          this.commonList.push({
            label: 'Duplicate Template',
            key: 'clone',
            name: 'clone',
            tooltip: 'Duplicate this template',
          });

        this.documentType = template.template.templateInfo.type;
        this.templateData = template.template;
        this.totalQuestion = template.template.questionCount;
        this.templateType = template.template.templateInfo.type;

        let deleteIndex = this.commonList.findIndex(
          (ele) => ele.key === 'trashcan'
        );
        if (template.template.templateInfo?.isSystem && deleteIndex > -1)
          this.commonList.splice(deleteIndex, 1);

        if (this.isManager) {
          if (this.templateType == 'dd_profile') {
            this.RequestButtonLabel = 'New Q/A Library Project';
            this.RequestButtonTooltip =
              'Create a new Q/A library project to backload or manage your latest Q/A content.';
            this.previewLabelTooltip =
              'Please activate this template to use for a pre-approved project.';
          } else {
            this.RequestButtonLabel = 'New Project';
            this.RequestButtonTooltip =
              'Manage investor request received in Word / Excel or standard DDQ project with this template.';
            this.previewLabelTooltip =
              'Please activate this template to use to manage an investor request or standard DDQ project.';
          }
        }
        if (this.isInvestor) {
          if (this.templateType == 'dd_profile') {
            this.RequestButtonLabel = 'New Internal Profile';
            this.RequestButtonTooltip = 'Create a new internal profile';
            this.previewLabelTooltip =
              'Please activate this template to use for internal profile.';
          } else {
            this.RequestButtonLabel = 'Start New Request';
            this.RequestButtonTooltip =
              'Start new data, diligence or document request.';
            this.previewLabelTooltip =
              'Please activate this template to use for requests.';
          }
        }
        if (template.template.frequency_id)
          this.frequencyTemp = frequency[template.template.frequency_id].value;
        else this.frequencyTemp = 'None';

        if (!this.templateData.templateInfo.is_draft) {
          if (this.templateData.templateInfo.mappedRatingSchemes) {
            this.previewMoreList = [
              {
                label: 'View Associated Rating Scheme',
                key: 'rating',
                name: 'viewScore',
                tooltip: 'Redirect to the associated rating definition.',
              },
            ];
            this.editMoreList = [
              {
                label: 'View Associated Rating Scheme',
                key: 'rating',
                name: 'viewScore',
                tooltip: 'Redirect to the associated rating definition.',
              },
            ];
          } else {
            if (!template.template.templateInfo?.isSystem) {
              this.previewMoreList = [
                {
                  label: 'Generate Rating / Score Map',
                  key: 'rating',
                  name: 'rating',
                  tooltip: 'Create rating / score map for this template.',
                },
              ];
              this.editMoreList = [
                {
                  label: 'Generate Rating / Score Map',
                  key: 'rating',
                  name: 'rating',
                  tooltip: 'Create rating / score map for this template.',
                },
              ];
            }
          }
        }
        this.moreDropDownMenu();
      }
      this.isLoaded = true;
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy.unsubscribe();
    this.routerSub.unsubscribe();
  }

  dropDownClick(event) {
    if (event.name == 'notepad') this.addDescription();
    else if (
      event.name == 'viewScore' &&
      this.templateData.templateInfo.mappedRatingSchemes
    )
      this.onViewScore();
    else if (event.name == 'rating') this.addScore();
    else if (event.name == 'trashcan') this.onTemplateDelete();
    else if (event.name == 'download3') this.onTemplateDownload();
    else if (event.name == 'clone') this.cloneTemplate();
    else if (event.name == 'scores') this.onScore();
  }

  moreDropDownMenu() {
    if (
      (window as any).location.hash.includes('preview') &&
      !(window as any).location.hash.includes('print_preview')
    ) {
      if (this.isInvestor) {
        this.moreList = [
          ...this.previewMoreList,
          {
            label: 'Set Flag / Score',
            key: 'scores',
            name: 'scores',
            tooltip: 'Set flags and scores for this template.',
          },
          ...this.commonList,
        ];
      } else {
        this.moreList = [...this.commonList];
      }
      this.currentMode = 'preview';
    } else if ((window as any).location.hash.includes('scoring')) {
      if (this.templateStatus == 'Draft') this.width = 300;
      else this.width = 200;

      this.currentMode = 'score';
    } else if ((window as any).location.hash.includes('print_preview')) {
      this.width = 300;
      this.currentMode = 'print';
    } else {
      if (this.isInvestor) {
        this.width = 500;
        this.moreList = [...this.editMoreList, ...this.commonList];
      } else {
        this.width = 400;
        this.moreList = [...this.commonList];
      }
    }

    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (this.previousUrl === event.url) return;
        let res: any = { url: window.location.hash.split('#')[1] };
        this.previousUrl = res.url;
        this.toggleMoreDropDown = false;
        this.canRoute(res.url);
        this.currentUrl = res.url.split('/');
        if (
          this.currentUrl[5]?.includes('preview') &&
          this.currentUrl[5] != 'print_preview'
        ) {
          this.width = 500;
          if (this.isInvestor) {
            this.moreList = [
              ...this.previewMoreList,
              {
                label: 'Set Flag / Score',
                key: 'scores',
                name: 'scores',
                tooltip: 'Set flags and scores for this template.',
              },
              ...this.commonList,
            ];
          } else {
            this.moreList = [...this.commonList];
          }
          this.currentMode = 'preview';
        } else if (this.currentUrl[5] == 'scoring') {
          if (this.templateStatus == 'Draft') this.width = 300;
          else this.width = 200;
          this.currentMode = 'score';
        } else if (this.currentUrl[5] == 'print_preview') {
          this.width = 300;
          this.currentMode = 'print';
        } else {
          this.currentMode = 'edit';
          if (this.isInvestor) {
            this.width = 500;
            this.moreList = [...this.editMoreList, ...this.commonList];
          } else {
            this.width = 400;
            this.moreList = [...this.commonList];
          }

          if (!this.moreList.filter((x) => x.key == 'notepad').length) {
            this.moreList = [
              {
                label: 'Add Internal Notes',
                key: 'notepad',
                name: 'notepad',
                tooltip: 'Add internal notes.',
              },
              ...this.moreList,
            ];
          }
        }
      });
  }

  canRoute(url) {
    this.isCatRoute =
      url.includes('categories') &&
      url.includes('subcategories') &&
      url.includes('questions');
  }

  /* ------------------THIS SECTION DEALS WITH FUNCTIONS RELATING MORE DROP DOWN ------------------------*/
  addDescription() {
    this.modal.invoke('add-notes', {
      initialState: {
        entityId: +this.templateData.templateInfo.id,
        entityType: 'Template',
      },
      class: 'modal-lg',
    });
  }

  onTemplateDownload() {
    this.toastService.info(
      'Please wait while the Excel file is being generated.',
      'Processing Excel download...'
    );
    this.template
      .downloadTemplateAsExcel({
        template_id: this.templateData.templateInfo.id,
      })
      .subscribe(
        (res: any) => {
          saveAs(
            res,
            'Template_' + this.templateData.templateInfo.id + '.xlsx'
          );
          this.toastService.clear();
        },
        (error: any) => {
          handelConflict(
            error,
            this.templateData.templateInfo.id,
            this.SweetAlert,
            this.routerService,
            this.modal
          );
          this.toastService.clear();
        }
      );
  }

  onTemplateDelete() {
    this.SweetAlert.confirm({
      title: `Are you sure?`,
      text: `This template is associated with ${this.templateData.templateInfo.diligence_counts} active projects. The associated rating scheme will also be deleted.`,
      confirmButtonText: 'Yes, delete it!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteTemplate(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteTemplate(resolve) {
    return this.template
      .deleteTemplate(this.templateData.templateInfo.id)
      .pipe(finalize(() => resolve()))
      .subscribe((res) => {
        this.routerService.navigate('app.diligence.templates');
        this.toastService.success('Template deleted successfully');
      });
  }

  cloneTemplate() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to copy and edit this template?',
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.template
          .cloneTemplate(this.templateData.templateInfo.id)
          .subscribe(
            (res: any) => {
              this.toastService.success('Template was duplicated');
              this.routerService.navigateWithParams(
                'app.diligence.template.preview',
                {
                  templateId: res.id,
                },
                {
                  reload:true
                }
              );
            },
            (error) => {
              handelConflict(
                error,
                this.templateData.templateInfo.id,
                this.SweetAlert,
                this.routerService,
                this.modal
              );
            }
          );
      },
    });
  }

  onViewScore() {
    this.routerService.navigateWithParams(
      'app.firm.settings.investment_rating.types',
      { rating_id: this.templateData.templateInfo.mappedRatingSchemes[0] }
    );
  }

  addScore() {
    this.modal.invoke('rating-map');
  }

  /* -------------------- FUNCTION TO HANDLE LOGO CLICKS ------------------------ */
  onEdit() {
    this.isLoading = true;
    if (this.templateData.templateInfo.isExpiredTemplateVersion) {
      this.templateDataService
        .createVersion(
          this.templateData.templateInfo.id,
          this.templateData.templateInfo.version
        )
        .subscribe(
          (response: any) => {
            this.store.dispatch(
              new UpdateTemplate({
                template: {
                  version: response.version,
                },
              })
            );
            this.gotoEditTemplate();
          },
          (e) => {
            this.gotoEditTemplate();
            handelConflict(
              e,
              this.templateData.templateInfo.id,
              this.SweetAlert,
              this.routerService,
              this.modal
            );
          }
        );
    } else {
      this.gotoEditTemplate();
    }
  }

  gotoEditTemplate() {
    this.isLoading = false;
    this.store.dispatch(new UpdateActiveSectionId(null));
    this.store.dispatch(
      new UpdateRouteParams({ categoryId: null, subCategoryId: null })
    );
    this.routerService.navigateWithParams('app.diligence.template.categories', {
      templateId: this.templateData.templateInfo.id,
    });
  }

  onPreview() {
    this.routerService.navigateWithParams('app.diligence.template.preview', {
      templateId: this.templateData.templateInfo.id,
    });
  }

  onScore() {
    this.routerService.navigateWithParams('app.diligence.template.scoring', {
      templateId: this.templateData.templateInfo.id,
    });
  }

  onActivate() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to activate this template?',
      text: 'This template can be used in requests',
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.template
          .getTemplateData(this.templateData.templateInfo.id)
          .subscribe(
            (res: any) => {
              if (res.templateInfo.canActivate) {
                this.store.dispatch(new ActivateTemplate()).subscribe((ans) => {
                  this.store.dispatch(new UpdateTemplate({}));
                  this.store.dispatch(new GetTemplateInfo());
                  this.toastService.success('Template successfully activated');
                });
              } else {
                this.toastService.error(
                  'Each category should have atleast 1 subcategory. Each subcategory should have atleast 1 question'
                );
              }
            },
            (error) => {
              handelConflict(
                error,
                this.templateData.templateInfo.id,
                this.SweetAlert,
                this.routerService,
                this.modal
              );
            }
          );
      },
    });
  }

  handleNewRequest() {
    if (
      (this.documentType == 'dd_profile' && this.isInvestor) ||
      this.isManager
    ) {
      this.modal.invoke('add-ddq', {
        initialState: {
          type: this.templateType,
          template_id: this.templateData.templateInfo.id,
          source: 'template',
          request: { template_id: this.templateData.templateInfo.id },
        },
        class: 'gray modal-lg',
      });
    } else {
      this.routerService.navigateWithParams('app.diligence.invite', {
        templateId: this.templateData.templateInfo.id,
      });
    }
  }

  handlePrint() {
    this.routerService.navigateWithParams(
      'app.diligence.template.print_preview',
      {
        templateId: this.templateData.templateInfo.id,
      }
    );
  }

  handleMore() {
    this.toggleMoreDropDown = !this.toggleMoreDropDown;
  }

  handleBack() {
    if (
      this.routerService.history.length > 2 &&
      this.routerService.history[
        this.routerService.history.length - 3
      ].includes('questionnaire')
    ) {
      this.routerService.navigateAngular(
        this.routerService.history[this.routerService.history.length - 3]
      );
      return;
    }

    window.history.back();
    setTimeout(() => {
      let { categoryId, subcategoryId } = this.routerService.getState().params;
      this.store.dispatch(
        new UpdateRouteParams({
          categoryId: categoryId,
          subCategoryId: subcategoryId,
        })
      );
      this.store.dispatch(new UpdateActivePanelId(``));
      this.panelService.close();
    }, 100);
    // }
  }

  printSection() {
    const el = document.getElementById('js-print-template-new');
    const body = document.getElementsByTagName('BODY')[0];
    body.classList.add('print-initiated');
    el.classList.add('print-section');
    window.print();
    setTimeout(() => body.classList.remove('print-initiated'));
  }
}
