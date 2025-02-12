import { Component, Input, OnInit } from '@angular/core';
import { frequency } from 'src/app2/modules/template-builder/constants/frequency';
import { ColorTheme } from '../../themes/color.themes';
@Component({
  selector: 'dv-info',
  templateUrl: './dv-info.component.html',
  styleUrls: ['./dv-info.component.css'],
})
export class DvInfoComponent implements OnInit {
  //Template Information

  totalCategories: number = 0;
  totalSubCategories: number = 0;
  frequency: string = 'None';
  isDraft: boolean;
  templateStatus: string = '';
  tagType: string;
  // List Questions
  totalQuestions: number = 0; // done
  mandatoryQuestions: number = 0; // done
  requireAttachments: number = 0; // done
  textResponse: number = 0; //
  areYesNo: number = 0; // done
  areConditionalLogic: number = 0;
  areGrid: number = 0; // done
  templateID: number;
  isManager: boolean = false;
  templateVersion: number;
  loader: boolean = true;
  colorTheme: any = ColorTheme;
  @Input() template: any;
  @Input() templateMetaData: any;
  @Input() isProject: boolean = false;
  @Input() type: 'templateInfo' | 'questionInfo' | 'both' = 'both';
  constructor() {}

  ngOnInit(): void {
    if (this.template) {
      if (this.template.isManager) this.isManager = true;
      this.isDraft = this.template.templateInfo.is_draft;
      this.templateID = this.template.templateInfo.id;
      this.templateVersion = this.template.version;

      if (!this.isManager)
        if (this.template.templateInfo.is_draft === true) {
          this.templateStatus = 'Draft';
          this.tagType = 'inProgress';
        } else if (this.template.templateInfo.is_draft === false) {
          this.templateStatus = 'Active';
          this.tagType = 'default';
        }

      if (this.isManager) {
        this.templateStatus = this.template.status;
        this.tagType = this.template.status;
      }

      if (this.template.frequency_id) {
        this.frequency = frequency[this.template.frequency_id].value;
      }
      this.areGrid = this.templateMetaData?.grid_questions;
      this.requireAttachments = this.templateMetaData?.attachment_questions;
      this.areYesNo = this.templateMetaData?.boolean_questions;
      this.mandatoryQuestions = this.templateMetaData?.mandatory_questions;
      this.textResponse = this.templateMetaData?.wordlimit_questions;
      this.areConditionalLogic = this.templateMetaData?.num_rules;
      this.totalCategories = this.templateMetaData?.category_count;
      this.totalSubCategories = this.templateMetaData?.subcategory_count;
      this.totalQuestions = this.templateMetaData?.total_questions;
    }
  }
}
