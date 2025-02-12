import Handsontable from 'handsontable';
let customPercentageRenderer = (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) => {
  Handsontable.renderers.NumericRenderer.apply(this, [
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties,
  ]);

  // With numbro you will have to make sure that you always pass an integer value to it
  if (value) {
    td.title = cellProperties.comment ? cellProperties.comment : '';
    td.innerHTML = Number.isFinite(+value)
      ? (window as any).numbro(value).format({ thousandSeparated: true }) + '%'
      : value;
  }
  return td;
};

export default customPercentageRenderer;
