import Handsontable from 'handsontable';

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

let customNumericRenderer = function (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);
  if (value) {
    td.title = cellProperties.comment ? cellProperties.comment : '';
    td.innerHTML = numberWithCommas(value);
  }
  return td;
};

export default customNumericRenderer;
