import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { TemplateState } from '../../store/template-builder.state';
import { frequency } from '../../constants/frequency';
import {
  EditTemplate,
} from '../../store/template-builder.action';
import { ToastrService } from 'ngx-toastr';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { Regex } from 'src/app2/shared/constants/constant';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'edit-template-modal',
  templateUrl: './edit-template-modal.component.html',
  styleUrls: ['./edit-template-modal.component.css'],
})
export class EditTemplateModalComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('templateName') templateName: NgModel;
  @Input() OnSuccess;
  templateTitle: string = 'New Test Template';
  updateStatus: string = 'Last updated few seconds ago';
  totalCategories: number = 0;
  totalSubCategories: number = 0;
  frequencyList: any;
  title: string = '';
  templateStatus: string = '';
  isDraft: boolean;
  accgroup: boolean;
  templateID: number;
  @Input() templateData: any;
  tinyMceInit = {
    placeholder: 'Add Description',
  };
  disableUpdateButton: boolean = false;
  firstLoading: boolean = false;
  description: string;
  private destroy: Subject<boolean> = new Subject<boolean>();

  frequencySelected: any;
  templateMetaData = null;
  headerLabel = 'questions';
  isSystemTemplate = false;
  @Select(TemplateState.getTemplateInfo) templateInfo: any;
  strategies: any[];
  is_vendor: any;
  classification: any = null;
  Regex = Regex;
  constructor(
    private readonly store: Store,
    private readonly toast: ToastrService,
    readonly templateService: TemplateService,
    private Utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.is_vendor = this.Utils.isVendorSubscription();
    if (this.is_vendor) {
      this.templateService.getVendors().subscribe((vendorStrategies: any) => {
        this.strategies = vendorStrategies;
      });
    } else {
      this.templateService
        .getStrategies()
        .subscribe((vendorStrategies: any) => {
          this.strategies = vendorStrategies;
          this.destroy = this.templateInfo.subscribe((template) => {
            if (template.template) {
              this.templateTitle = template.template.hasOwnProperty('name')
                ? template.template.name
                : template.template.templateInfo.name;
              this.updateStatus = template.template.last_updated_at;
              this.templateID = template.template.templateInfo.id;
              this.classification =
                template.template.templateInfo.strategyID == 0
                  ? null
                  : template.template.templateInfo.strategyID;
              this.description = template.template.templateInfo.desc;
              this.isDraft = template.template.templateInfo.is_draft;
              this.disableUpdateButton =
                template.template?.templateInfo?.isSystem;
              this.isSystemTemplate = template.template?.templateInfo?.isSystem;

              this.title = `
      <div style="display:flex">
          <i class="dvi ng-isolate-scope dvi-file fa-2x " style="
          color: #126b82;
          font-size:40px;
        "></i>
        <div style="display:flex;flex-direction:column;">
          <div style="color:#126b82;font: normal normal 600 18px Open Sans;">
          ${this.templateTitle}
          </div>
          <div style="font: italic normal normal 12px Open Sans;">
          ${this.updateStatus}
          </div>
        </div>
      </div>`;
              if (
                !this.strategies?.some(
                  (strategy) => strategy.id === this.classification
                ) &&
                this.classification
              ) {
                this.strategies.push({
                  name: template.template.strategy,
                  id: this.classification,
                  is_system: true,
                });
                this.strategies = [...this.strategies];
              }

              if (template.template.frequency_id && !this.frequencySelected) {
                this.frequencySelected =
                  frequency[template.template.frequency_id];
              }
              this.frequencyList = Object.values(frequency);
              if (!this.templateMetaData) {
                this.templateService
                  .getQuestionInfo(this.templateID, template.template.version)
                  .subscribe((res: any) => {
                    this.templateMetaData = res;
                    const { total_questions } = this.templateMetaData;
                    this.headerLabel =
                      total_questions +
                      (total_questions <= 1 ? ` question` : ` question`);
                  });
              }
            }
          });
        });
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy.unsubscribe();
  }

  handleNameChange(name: string) {
    if (!name || this.templateName?.errors?.containsHtml)
      this.disableUpdateButton = true;
    else this.disableUpdateButton = false;
  }

  updateTemplate(close) {
    this.firstLoading = true;
    let id = this.frequencySelected;
    if (typeof this.frequencySelected != 'number' && this.frequencySelected) {
      id = this.frequencySelected.id;
    }
    let payload = {
      frequency_id: id,
      strategyID: this.classification,
      name: JSON.parse(JSON.stringify(this.templateTitle)),
      desc: JSON.parse(JSON.stringify(this.description)),
    };

    this.store.dispatch(new EditTemplate(payload)).subscribe(
      (res) => {
        this.firstLoading = false;
        close();
        this.OnSuccess();
        this.toast.success('Template edited successfully');
      },
      (error) => {
        this.firstLoading = false;
      }
    );
  }

  handleEditorChange(desc: string) {
    this.description = desc;
  }
}
