import { GridNumericEditor } from '../common/hands-on-table/editors/customGridNumericEditor';
import { customGridIntegerValidator } from '../common/hands-on-table/validators/customGridIntegerValidator';
import { customGridNumericValidator } from '../common/hands-on-table/validators/customGridNumericValidator';
import CustomMultiSelectRenderer from 'src/app2/shared/common/hands-on-table/renderers/multiselectRenderer';
import CustomPercentageRenderer from 'src/app2/shared/common/hands-on-table/renderers/percentageRenderer';
import CustomTextRenderer from 'src/app2/shared/common/hands-on-table/renderers/textRenderer';
import CustomNumericRenderer from 'src/app2/shared/common/hands-on-table/renderers/numericRenderer';
// import MultiSelectEditor from 'src/app2/shared/common/hands-on-table/editors/multiselectEditor';

export class HandsOnTableGridHelper {
  static getTableString(data) {
    let tableString = '';
    data.forEach((row, rowIndex) => {
      if (rowIndex > 0) {
        tableString += '\n';
      }
      row.forEach((cell, columnIndex) => {
        if (columnIndex > 0) {
          tableString += '\t' + (cell ?? '');
        } else {
          tableString += cell ?? '';
        }
      });
    });
    return tableString;
  }

  static getHandsOnTableColumns(columns, isReadOnly) {
    let cols = columns.map((column, idx) => {
      let newColumn;
      if (column.type == 'dropdown') {
        if (column.type_options.enable_multiselection) {
          let sourceMap = column.type_options.source.map((column, index) => {
            return {
              id: column,
              label: column,
            };
          });

          newColumn = {
            data: `column_${idx}.value`,
            editor: 'MultiSelectEditor', // RouterBUG
            renderer: CustomMultiSelectRenderer,
            select: {
              config: {
                separator: ',',
                valueKey: 'id',
                labelKey: 'label',
              },
              options: sourceMap,
            },
            title: column.name,
          };
        } else {
          newColumn = {
            data: `column_${idx}.value`,
            type: 'dropdown',
            source: column.type_options.source,
            title: column.name,
            allowInvalid: false,
            strict: true,
            trimDropdown: false,
          };
        }

        newColumn.placeholder = !isReadOnly ? 'Please select an option' : null;
      } else if (column.type == 'numeric') {
        column['format'] = '0,0';
        if (column.type_options.format == undefined) {
          column.type_options.format = null;
        }
        newColumn = {
          data: `column_${idx}.value`,
          renderer: CustomNumericRenderer,
          editor: GridNumericEditor,
          type: 'text',
          format: '0,0',
          title: column.name,
          validator: customGridNumericValidator,
        };
        newColumn.placeholder = !isReadOnly
          ? 'Please enter numeric value'
          : null;
      } else if (column.type == 'percentage') {
        newColumn = {
          data: `column_${idx}.value`,
          renderer: CustomPercentageRenderer,
          validator: customGridNumericValidator,
          editor: GridNumericEditor,
          type: 'text',
          title: column.name,
        };
        newColumn.placeholder = !isReadOnly
          ? 'Please enter percentage value'
          : null;
      } else if (column.type == 'integer') {
        newColumn = {
          data: `column_${idx}.value`,
          renderer: CustomNumericRenderer,
          editor: GridNumericEditor,
          type: 'text',
          title: column.name,
          validator: customGridIntegerValidator,
        };
        newColumn.placeholder = !isReadOnly
          ? 'Please enter integer value'
          : null;
      } else if (column.type == 'date') {
        newColumn = {
          data: `column_${idx}.value`,
          type: 'date',
          dateFormat: column.type_options.dateFormat,
          correctFormat: true,
          defaultDate: column.type_options.defaultDate,
          title: column.name,
        };
        newColumn.placeholder = !isReadOnly ? 'Please enter date value' : null;
      } else {
        newColumn = {
          data: `column_${idx}.value`,
          type: 'text',
          title: column.name,
          renderer: CustomTextRenderer,
        };
        if (!isReadOnly) {
          newColumn.placeholder = 'Please enter text value';
        }
      }
      newColumn.readOnly = column.readOnly || isReadOnly;
      return newColumn;
    });
    return cols;
  }
}
