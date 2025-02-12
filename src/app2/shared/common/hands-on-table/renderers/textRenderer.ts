import Handsontable from 'handsontable';
let customTextRenderer = function (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  if (value) {
    if (cellProperties.comment) {
      td.title = cellProperties.comment;
    }
    if (value.length > 25) {
      td.innerHTML = value.slice(0, 25) + '...';
    } else {
      td.innerHTML = value;
    }
  }
  return td;
};

export default customTextRenderer;
