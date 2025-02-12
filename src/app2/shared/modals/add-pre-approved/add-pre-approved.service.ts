import { Injectable } from '@angular/core'; // Import the Injectable decorator if you're using Angular
import * as moment from 'moment';
import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';

@Injectable({
  providedIn: 'root',
})
export class AddPreApprovedService {
  constructor() {}

  getSelectedEntityType(source, entity_details, response) {
    return source === 'questionnaire'
      ? entity_details.entity_type
      : source === 'question_detail'
      ? response.associated_entity_type
      : 'Firm';
  }

  setModalTitle(source) {
    return source == 'question_detail'
      ? 'Edit Response'
      : 'Add Q/A(s) to Library';
  }

  getEntityTypes(keywordConstants, Utils) {
    return [
      {
        name: keywordConstants.Firm,
        label: 'My ' + Utils.getDisplayEntityType(keywordConstants.Firm),
        icon: 'institution',
        size: '1x',
      },
      {
        name: keywordConstants.Strategy,
        label: Utils.getDisplayEntityType(keywordConstants.Strategy),
        icon: 'strategy',
        size: '1x',
      },
      {
        name: keywordConstants.Product,
        label: Utils.getDisplayEntityType(keywordConstants.Product),
        icon: 'fund',
        size: '1x',
      },
      {
        name: keywordConstants.Vehicle,
        label: Utils.getDisplayEntityType(keywordConstants.Vehicle),
        icon: 'vehicle-car',
        size: '1x',
      },
    ];
  }
  getFirstButtonLabel(tab, source) {
    return tab == 'uploadNew'
      ? 'Import'
      : source === 'question_detail'
      ? 'Update'
      : source === 'project_history'
      ? 'Add Q/A(s) to Library'
      : 'Save';
  }
  getSecondButtonLabel(tab, source) {
    return source === 'question_detail' ||
      source === 'questionnaire' ||
      source === 'project_history' ||
      tab == 'uploadNew'
      ? null
      : 'Save & Add Another';
  }

  validateAnswerInQuestionnaireAndQAedit(response, formData, index) {
    const responseType = response?.responseType;
    const isBooleanPlusTrue =
      responseType === ResponseType.BooleanPlus &&
      formData?.questions[index]?.response?.booleanResponse === true;
    const isNoPlusFalse =
      responseType === ResponseType.NoPlus &&
      formData?.questions[index]?.response?.booleanResponse === false;

    return [
      ResponseType.TextMultiLine,
      ResponseType.Date,
      ResponseType.Percentage,
      ResponseType.Numeric,
      ResponseType.Identifier,
      ResponseType.TextPhone,
      ResponseType.Text,
    ].includes(responseType) ||
      isBooleanPlusTrue ||
      isNoPlusFalse
      ? [DvValidators.required]
      : [];
  }

  mapQuestions(questions: any[], editMode, responseTypes): any[] {
    return questions.map((question: any) => {
      const response = this.mapResponse(
        question.response_type,
        question.response_text_copy,
        question.response_text,
        question?.response_id,
        editMode,
        question.response?.localgrid_responses,
        question
      );
      const responseTypeId = responseTypes.find(
        (item) => item.text === question.response_type
      )?.id;

      return {
        ...(editMode && {
          id: question.question_id,
        }),
        text: this.getPlainTextFromHtml(question.question_text),
        response,
        responseTypeId,
        responseType: question.response_type,
        response_text_copy:
          question.response_text_copy || question.response_text,
        hint_text: question?.hint_text,
        tags_text: question?.tags_text,
        tag_ids: question?.tags?.map((x) => x?.id) || [],
        tagsList: question?.tags,
        expiry_date: question.expiry_date && new Date(question.expiry_date),
        gridData: question?.gridData,
      };
    });
  }

  mapResponse(
    responseType: string,
    responseTextCopy: string,
    responseText: string,
    responseId: number,
    editMode,
    grid_responses: any,
    question
  ): any {
    const numericResponseValue = parseFloat(responseTextCopy);
    const booleanResponseValue =
      responseTextCopy && responseTextCopy === 'Yes'
        ? true
        : responseTextCopy && responseTextCopy === 'No'
        ? false
        : undefined;
    const dateResponseValue =
      (responseTextCopy || responseText) &&
      (responseTextCopy || responseText).replace(/-/g, '/');
    const response = {
      ...(responseId &&
        editMode && {
          id: responseId,
        }),
      response_type: responseType,
      response_text_copy: responseTextCopy,
      textResponse: responseText,
      ...(responseType === 'Date' && {
        dateResponse: dateResponseValue && moment(dateResponseValue).toDate(),
        textResponse: undefined,
      }),
      ...([
        'Integer',
        'Percentage',
        'Numeric',
        'Identifier',
        'TextPhone',
      ].includes(responseType) && {
        numericResponseA: isNaN(numericResponseValue)
          ? undefined
          : numericResponseValue,
      }),
      ...([
        'Text',
        'TextEmail',
        'BooleanPlus',
        'NoPlus',
        'TextMultiLine',
      ].includes(responseType) && {
        textResponse: responseTextCopy,
      }),
      ...(['Boolean', 'BooleanPlus', 'NoPlus'].includes(responseType) && {
        booleanResponse: booleanResponseValue,
      }),
      ...(['Grid', 'DynamicGrid'].includes(responseType) && {
        localgrid_responses: grid_responses,
      }),
      ...(!['Text', 'TextEmail', 'TextMultiLine'].includes(responseType) &&
        question?.comments?.length > 0 && {
          textResponse: question?.comments[0]?.comment_text,
        }),
    };
    console.log(question, 'question data in map response function');
    return response;
  }

  getPlainTextFromHtml(htmlText) {
    var tempDivElement = document.createElement('div');
    tempDivElement.innerHTML = htmlText;
    return tempDivElement.textContent || tempDivElement.innerText || '';
  }

  getFormattedGridData(gridData, sourceData) {
    let data = [];
    sourceData?.forEach((row, rowIndex) => {
      Object.values(row).forEach((item: any, columnIndex) => {
        let cell = {
          row_id: item.row_id,
          column_id: item.column_id,
          value: gridData[rowIndex][columnIndex],
          row_group_id: item.row_group_id,
          column_group_id: item.column_group_id,
          formula: item.formula,
          is_aggregated: item.is_aggregated,
        };
        data.push(cell);
      });
    });
    return data;
  }

  getPartsFromDashes(
    input: string
  ): { before: string; between: string; after: string } | null {
    const regex = /^([^\-]+)-([^\-]+)-([^\-]+)$/;
    const matches = input.match(regex);
    if (matches && matches.length === 4) {
      return {
        before: matches[1],
        between: matches[2],
        after: matches[3],
      };
    }
    return null;
  }

  validateResponse(response, formData, error) {
    let isValid = !error;
    if (
      response.responseType == ResponseType.Boolean &&
      formData.questions[0].response.booleanResponse == null
    ) {
      isValid = false;
    } else if (
      ((response.responseType == ResponseType.BooleanPlus &&
        formData.questions[0].response.booleanResponse === true) ||
        (response.responseType == ResponseType.NoPlus &&
          formData.questions[0].response.booleanResponse === false)) &&
      !formData.questions[0].response.textResponse
    ) {
      isValid = false;
    } else if (
      response.responseType == ResponseType.TextEmail &&
      !formData.questions[0].response.textResponse
    ) {
      isValid = false;
    } else if (
      response.responseType == ResponseType.Integer &&
      formData.questions[0].numericResponseA == null
    ) {
      isValid = false;
    }

    return isValid;
  }
}
