import { Component, Input } from '@angular/core';
import * as angular from 'angular';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-preview-accordion',
  templateUrl: './preview-accordion.component.html',
  styleUrls: ['./preview-accordion.component.css'],
})
export class PreviewAccordionComponent {
  @Input() sections: any;
  @Input() documentHasDuplicates: boolean = false;
  @Input() isQAflow: boolean = false;
  @Input() activeView: string = 'original';
  @Input() responseTypes: any;
  section: any;
  gridResponseTypes = [
    {
      text: 'Grid',
      description: 'Grid / Table',
      id: 4,
    },
    {
      text: 'DynamicGrid',
      description: 'Customize Grid / Table',
      id: 20,
    },
  ];

  constructor(private toaster: ToastrService) {}

  toggleAccordion(isOpen: boolean, section: any) {
    section.isOpen = isOpen;
    this.section = section;
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

  valildateQuestionSelection(question, subSection, section) {
    let sub_section = angular.copy(subSection);
    let selectedQuestions = sub_section.questions.filter(
      (entry) => entry.is_selected
    );
    if (!selectedQuestions.length && !this.isQAflow) {
      setTimeout(() => {
        question.is_selected = true;
      });
      this.toaster.error('Atleast one question is required');
    } else if (
      this.isQAflow &&
      this.activeView == 'original' &&
      !selectedQuestions.length
    ) {
      setTimeout(() => {
        question.is_selected = true;
      });
      this.toaster.error('Atleast one question is required');
    }
  }

  handleEditorTextChange($event, question) {
    question.responseHTML = $event;
  }

  changeResponseType(type, question) {
    question.responseType = type.text;
    question.responseTypeDesc = type.description;
    question.responseTypeInt = type.id;
  }

  /* WIP - to support response type conversion */
  canConvertToResponseType(question) {
    const trimmedText = (question?.responseHTML || '').trim();
    const trimmedTextLowerCase = trimmedText?.toLocaleLowerCase();
    const emailRegex = /\S+@\S+\.\S+/;

    const isInteger = !isNaN(parseFloat(trimmedText));
    const isBoolean = ['yes', 'no'].includes(trimmedTextLowerCase);
    const isDate = !isNaN(Date.parse(trimmedText));
    const isEmail = emailRegex.test(trimmedText);

    const responseTypeConverstionValues = {};
    if (isInteger) {
      responseTypeConverstionValues['integerValue'] = parseFloat(trimmedText);
    } else if (isBoolean) {
      responseTypeConverstionValues['booleanValue'] =
        trimmedTextLowerCase == 'yes';
    } else if (isDate) {
      responseTypeConverstionValues['dateValue'] = trimmedText;
    }
    question['responseTypeConversionValues'] = responseTypeConverstionValues;
    /*
        date - 11
        textemail - 7
        Identifier - 19
        Numeric - 2
        Integer - 8
        percentage - 9
        textphone - 6
        TextMultiLine - 5
        Boolean - 0
    */
    const resTypes = this.responseTypes.map((type) => {
      if (type.id == 11) {
        type.disabled = !isDate;
      } else if (type.id == 7) {
        type.disabled = !isEmail;
      } else if ([19, 2, 8, 9, 6].includes(type.id)) {
        type.disabled = !isInteger;
      } else if (type.id == 0) {
        type.disabled = !isBoolean;
      } else if ([17, 12, 20, 3, 4, 13, 10, 18, 15, 14].includes(type.id)) {
        type.disabled = trimmedText.length > 0;
      }
      return type;
    });

    return resTypes;
  }
}
