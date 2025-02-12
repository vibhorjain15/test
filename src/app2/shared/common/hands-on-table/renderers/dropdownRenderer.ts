import Handsontable from 'handsontable';

let customDropdownRenderer = (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) => {
  let optionsList: any[] = cellProperties.chosenOptions.data;

  if (
    typeof optionsList == 'undefined' ||
    typeof optionsList.length == 'undefined' ||
    !optionsList.length
  ) {
    Handsontable.cellTypes.text.renderer(
      instance,
      td,
      row,
      col,
      prop,
      value,
      cellProperties
    );
    return td;
  }

  let values = (value + '').split(',');
  value = [];
  optionsList?.forEach((option) => {
    if (values.indexOf(option.id + '') > -1) value.push(option.label);
  });

  value = value.join(', ');

  Handsontable.cellTypes.text.renderer(
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties
  );
  return td;
};

export default customDropdownRenderer;
