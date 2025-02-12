import {
  responseTypeList,
  responseType,
} from '../constants/responseType.constant';

export const getFilteredResponseType = (response) => {
  switch (response) {
    case 'Boolean':
    case 'NoPlus':
    case 'BooleanPlus':
      return responseTypeList.filter(
        (val) =>
          val.text == responseType.Boolean ||
          val.text == responseType.NoPlus ||
          val.text == responseType.BooleanPlus
      );
    case 'TextEmail':
      return responseTypeList.filter(
        (val) =>
          val.text == responseType.TextEmail ||
          val.text == responseType.TextMultiLine ||
          val.text == responseType.Text
      );
    case 'Text':
      return responseTypeList.filter(
        (val) =>
          val.text == responseType.TextMultiLine ||
          val.text == responseType.Text
      );
    case 'Dropdown':
      return responseTypeList.filter(
        (val) =>
          val.text == responseType.Dropdown || val.text == responseType.CheckBox
      );
    case 'Integer':
    case 'Numeric':
      return responseTypeList.filter(
        (val) =>
          val.text == responseType.Integer || val.text == responseType.Numeric
      );
    default:
      return responseTypeList.filter((val) => val.text == response);
  }
};
