import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Select } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { TemplateState } from '../../store/template-builder.state';

@Component({
  selector: 'template-header',
  templateUrl: './template-header.component.html',
  styleUrls: ['./template-header.component.css'],
})
export class TemplateHeaderComponent implements OnInit, OnDestroy {
  @Input() title = 'Categories and Sub-categories';
  @Input() subtitle = 'Sample Subtitle';
  @Select(TemplateState.getTemplateInfo) templateInfo: any;
  templateTypeName: any;
  isLoaded = false;
  template: any;
  private destroy: Subject<boolean> = new Subject<boolean>();
  constructor(
    private readonly modal: CustomModalService,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.getTemplateInfo();
  }

  getTemplateInfo() {
    this.templateInfo
      .pipe(takeUntil(this.destroy))
      .subscribe((template: any) => {
        if (template.template) {
          this.template = template.template;
          this.title = template.template.hasOwnProperty('name')
            ? template.template.name
            : template.template.templateInfo.name;
          this.subtitle = template.template.last_updated_at;
          this.getTemplateTypeDisplay(template.template?.templateInfo.type);
          this.isLoaded = true;
        }
      });
  }

  getTemplateTypeDisplay(templateType) {
    this.templateTypeName =
      templateType == 'dd_doc'
        ? 'DOCUMENT'
        : templateType == 'dd_profile'
        ? this.Utils.isInvestor()
          ? 'PROFILE'
          : 'Q/A Library'
        : templateType == 'dd_new'
        ? 'STANDARD'
        : '';
  }

  editWidget() {
    this.modal.invoke('edit-template', {
      initialState: {
        templateData: this.template,
        OnSuccess: () => {
          this.getTemplateInfo();
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.unsubscribe();
  }
}
