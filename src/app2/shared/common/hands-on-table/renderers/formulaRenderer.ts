import Handsontable from 'handsontable';
let customFormulaRenderer = (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) => {
  Handsontable.renderers.TextRenderer.apply(this, [
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties,
  ]);
  let sourceData = instance.getSourceDataAtCell(row, col);
  if (
    sourceData != null &&
    sourceData != undefined &&
    value != null &&
    (!value.toString().startsWith('#') ||
      value.toString() == '#VALUE!' ||
      value.toString() == '#DIV/0!' ||
      value.toString() == '#N/A')
  ) {
    td.innerHTML = sourceData;
    if (td.classList.contains('htPlaceholder')) {
      td.classList.remove('htPlaceholder');
    }
  }
  return td;
};

export default customFormulaRenderer;
