import { ResponseType } from '../constants/Response-type.constant';

export function getResponseValueTypes(responseType: any): string[] {
  let attrs: string[];
  switch (responseType) {
    case ResponseType.Date:
      attrs = ['dateResponse', 'textResponse', 'response_type'];
      break;
    case ResponseType.Boolean:
      attrs = ['booleanResponse', 'textResponse', 'response_type'];
      break;
    case ResponseType.Text:
    case ResponseType.TextMultiLine:
    case ResponseType.TextEmail:
      attrs = ['textResponse', 'textResponse', 'response_type'];
      break;
    case ResponseType.Numeric:
    case ResponseType.TextPhone:
    case ResponseType.Integer:
    case ResponseType.Percentage:
    case ResponseType.Identifier:
      attrs = ['numericResponseA', 'textResponse', 'response_type'];
      break;
    case ResponseType.Dropdown:
    case ResponseType.CheckBox:
      attrs = ['listValueID', 'textResponse', 'response_type'];
      break;
    case ResponseType.BooleanPlus:
    case ResponseType.NoPlus:
      attrs = ['booleanResponse', 'textResponse', 'response_type'];
      break;
    case ResponseType.Bookends:
      attrs = [
        'numericResponseA',
        'numericResponseB',
        'textResponse',
        'response_type',
      ];
      break;
    case ResponseType.Grid:
    case ResponseType.DynamicGrid:
      attrs = ['grid_responses', 'textResponse', 'response_type'];
      break;
    case ResponseType.Attachment:
      attrs = ['attachmentIds', 'textResponse', 'response_type'];
      break;
    case ResponseType.ReturnTable:
      attrs = ['returnTable_id', 'textResponse', 'response_type'];
      break;
    case ResponseType.aumTable:
      attrs = ['aumTable_id', 'textResponse', 'response_type'];
      break;
  }
  return attrs;
}

