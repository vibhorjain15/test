import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { shareReplay } from 'rxjs/operators';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-dv-custom-fields',
  templateUrl: './dv-custom-fields.component.html',
  styleUrls: ['./dv-custom-fields.component.css'],
})
export class DvCustomFieldsComponent implements OnInit, OnChanges {
  @Input() entityType;
  @Input() entityId;
  @Input() customFields;
  @Output() onAdd = new EventEmitter();
  fields = [];
  loading_data;
  customFieldTypes = [
    'text',
    'int',
    'numeric',
    'dropdown',
    'checkbox',
    'date',
    'datetime',
  ];
  constructor(
    private routerService: RouterService,
    private customFieldService: CustomFieldsService,
    private toaster: ToastrService,
    private utils: UtilsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.customFields) {
      this.setFields();
    }
  }

  ngOnInit() {
    this.setFields();
  }

  async setFields() {
    if (this.customFields) {
      this.fields = [];
      for (let i = 0; i < this.customFields.length; i++) {
        const field = this.customFields[i];
        if (field.type === 'link' && this.linkHasValue(field.value)) {
          this.fields.push(field);
        } else if (field.type === 'rating') {
          if (field.value[0]?.project_id && field.value[0]?.total_score >= 0) {
            this.fields.push(field);
          }
        } else if (
          (field.type === 'int' || field.type === 'numeric') &&
          this.numberHasValue(field.value)
        ) {
          this.fields.push(field);
        } else if (
          (field.type == 'time' ||
            field.type == 'datetime' ||
            field.type == 'date') &&
          this.fieldHasValue(field.value)
        ) {
          field.value.forEach((item) => {
            item.dateDisplay = this.getDateDisplay(item.value, field.type);
          });
          this.fields.push(field);
        } else if (field.is_linked) {
          let params = {
            entity_id: this.entityId,
            entity_type: this.entityType,
            question_id: field.questions[0],
            template_id: field.template_id ?? 0,
          };

          this.customFieldService
            .getLatestResponses(params)
            .pipe(shareReplay(1))
            .subscribe((response) => {
              if (response) {
                field.value = response;
                this.fields.push(field);
              }
            }),
            (error) => {
              this.toaster.error(
                'Something went wrong while fetching linked fields.'
              );
            };
        } else if (this.fieldHasValue(field.value)) {
          this.fields.push(field);
        }
      }
    }
  }

  redirectToProject(field) {
    if (field.type == 'rating') {
      const url = this.routerService.href(
        'app.diligence.project.investment_ratings',
        {
          diligenceId: field.value[0]?.project_id,
          categoryId: field.value[0]?.category_id,
        }
      );
      window.open(url, '_blank');
    } else {
      const url = this.routerService.href(
        'app.diligence.project.questionnaire',
        {
          diligenceId: field.value.diligence_id,
        }
      );
      window.open(url, '_blank');
    }
  }

  linkHasValue(field) {
    if (field) {
      const fieldsWithValue = field.filter((item) => item.value_url);
      return fieldsWithValue.length > 0;
    } else {
      return false;
    }
  }

  fieldHasValue(field) {
    if (field) {
      const fieldsWithValue = field.filter((item) => {
        if (item.value == 'other') {
          item.value += `, ${item?.explanation}`;
        }
        return item.value;
      });
      return fieldsWithValue.length > 0;
    } else {
      return false;
    }
  }

  numberHasValue(field) {
    if (field) {
      const fieldsWithValue = field.filter(
        (item) => +item.value || item.value === 0
      );
      return fieldsWithValue.length > 0;
    } else {
      return false;
    }
  }

  getDateDisplay(value, type) {
    if (type == 'date') {
      return moment(value).format('DD-MMMM-yyyy');
    } else if (type == 'datetime') {
      return moment(value).format('DD-MMMM-yyyy, h:mm:ss a');
    } else if (type == 'time') {
      return moment(value, 'hh:mm:ss').format('hh:mm:ss A');
    }
  }

  onAdding() {
    this.onAdd.emit();
  }

  trackByIndex(index: number, element): number {
    return index;
  }

  getTextColor(backgroundColor) {
    return this.utils.isColorLightOrDark(backgroundColor, 200) == 'dark'
      ? 'white !important'
      : 'black !important';
  }
  getBackgroundColor(field) {
    if (!field.next_color_code || Number.isInteger(field.total_score)) {
      return field.color_code + ' !important';
    } else {
      return (
        this.utils.getColorForEntityRating(
          field.total_score,
          field.color_code,
          field.next_color_code
        ) + '!important'
      );
    }
  }
}
