import { Injectable } from '@angular/core';
import { ResponseType } from '../../questionnaire/constants/Response-type.constant';

@Injectable({
  providedIn: 'root',
})
export class TemplatePreviewService {
  constructor() {}

  updateLocalData(value, type, question) {
    if (
      type === ResponseType.Numeric ||
      type === ResponseType.Identifier ||
      type === ResponseType.Integer ||
      type === ResponseType.TextPhone ||
      type === ResponseType.Percentage
    ) {
      question.answer.attributes.numericResponseA = value;
    }
    if (type === ResponseType.Dropdown) {
      if (value?.value) value = value?.dropdown_option_id;
      question.answer.attributes.listValueID = [value];
    }
    if (type === ResponseType.CheckBox) {
      if (value?.checkedOptions) value = value?.checkedOptions;
      question.answer.attributes.listValueID = value;
    }
    if (type === ResponseType.Grid || type === ResponseType.DynamicGrid) {
    }
    if (
      type === ResponseType.TextEmail ||
      type === ResponseType.Text ||
      type === ResponseType.TextMultiLine
    ) {
      question.answer.attributes.textResponse = value;
    }
    if (
      type === ResponseType.NoPlus ||
      type === ResponseType.BooleanPlus ||
      type === ResponseType.Boolean
    ) {
      if (value?.boolean) {
        value = value.boolean;
      }
      question.answer.attributes.booleanResponse = value === 'yes';
    }
    if (type === ResponseType.Bookends) {
      question.answer.attributes.numericResponseA = value.min;
      question.answer.attributes.numericResponseB = value.max;
    }
    if (type === ResponseType.aumTable) {
      question.answer.attributes.aumTable_id = value;
    }
    if (type === ResponseType.ReturnTable) {
      question.answer.attributes.returnTable_id = value;
    }
    if (type === ResponseType.Date) {
      question.answer.attributes.dateResponse = value;
    }
    if (type === ResponseType.Attachment) {
      question.answer.attributes.attachmentIds = value;
    }
  }
}
