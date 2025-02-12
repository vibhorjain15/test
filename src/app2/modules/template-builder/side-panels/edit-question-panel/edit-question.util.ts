import { responseType } from '../../constants/responseType.constant';

export const getPreviewType = (res, type: responseType) => {
  if (type === responseType.Dropdown || type === responseType.CheckBox) {
    return {
      options: res.map((option) => ({
        is_active: option.is_active,
        text: option.value ?? option.dropdown_option_text,
        type: 'text',
        id: option.id ?? option.dropdown_option_id,
        groupid: option?.dropdown_value_groupid ?? 0,
        type_options: { type: 'text' },
      })),
    };
  }

  if (type === responseType.DynamicGrid) {
    let ColData = [];
    res.rows_columns.map((val) => {
      if (val.elementType !== 'Row') {
        ColData.push({
          is_active: true,
          text: val.name,
          type: val.type,
          id: val.id,
          group_id: val.group_id,
          type_options: val.type_options,
        });
      }
    });
    return {
      columns: ColData,
    };
  }

  if (type === responseType.Grid) {
    let rowData = [];
    let ColData = [];

    res.rows_columns.map((val) => {
      if (val.elementType === 'Row') {
        rowData.push({
          is_active: true,
          text: val.name,
          type: null,
          id: val.id,
          group_id: val.group_id,
        });
      } else {
        ColData.push({
          is_active: true,
          text: val.name,
          type: val.type,
          id: val.id,
          group_id: val.group_id,
          type_options: val.type_options,
        });
      }
    });
    return {
      rows: rowData,
      columns: ColData,
    };
  }
};
