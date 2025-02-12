import Handsontable from 'handsontable';

let multiSelectRenderer = (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) => {
  let _cellProperties$selec = cellProperties.select;
  let _cellProperties$selec2 = _cellProperties$selec.config;
  let config =
    _cellProperties$selec2 == undefined ? {} : _cellProperties$selec2;
  let availableOptions = _cellProperties$selec.options;
  let _config$separator = config.separator;
  let separator = _config$separator == undefined ? ',' : _config$separator; // defaultSeparator = , ?
  let TextCellType = Handsontable.cellTypes.text;
  if (
    typeof availableOptions == 'undefined' ||
    typeof availableOptions.length == 'undefined' ||
    !availableOptions.length
  ) {
    TextCellType.renderer(instance, td, row, col, prop, value, cellProperties);
    addDropdownIcon(td, instance, row, col);
    return td;
  }
  let stringValue = value ? ''.concat(value) : '';
  let valueArray = stringValue.split(separator);
  let formattedValue = valueArray.join(separator);
  TextCellType.renderer(
    instance,
    td,
    row,
    col,
    prop,
    formattedValue,
    cellProperties
  );
  addDropdownIcon(td, instance, row, col);
  let _formattedValue = formattedValue.split(',');
  if (_formattedValue.length > 1) {
    td.innerHTML =
      _formattedValue.slice(0, 1).toString() +
      ' and ' +
      _formattedValue.slice(1).length +
      ' More';
    td.title = formattedValue.toString();
  }
  return td;
};

function addDropdownIcon(td, instance, row, col) {
  let rootDocument = instance.rootDocument;
  let ARROW = rootDocument.createElement('DIV');
  ARROW.className = 'htMultiSelectArrow';
  ARROW.appendChild(rootDocument.createTextNode(String.fromCharCode(9660)));
  let eventManager = new Handsontable.EventManager(instance);
  if (!td.firstChild) {
    // http://jsperf.com/empty-node-if-needed
    // otherwise empty fields appear borderless in demo/renderers.html (IE)
    td.appendChild(rootDocument.createTextNode(String.fromCharCode(160))); // workaround for https://github.com/handsontable/handsontable/issues/1946
    // this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  }
  td.insertBefore(ARROW, td.firstChild);
  Handsontable.dom.addClass(td, 'htAutocomplete');
  if (!instance.htMultiSelectArrowListener) {
    // not very elegant but easy and fast
    instance.htMultiSelectArrowListener = function (event) {
      if (Handsontable.dom.hasClass(event.target, 'htMultiSelectArrow')) {
        // Select the cell that we want to edit. "hot" is the instance of Handsontable
        instance.view._wt.getSetting(
          'onCellClick',
          null,
          instance._createCellCoords(row, col),
          td
        );
        setTimeout(() => {
          instance.disableHide = true;
          instance.view._wt.getSetting(
            'onCellDblClick',
            null,
            instance._createCellCoords(row, col),
            td
          );
        }, 400);
      }
    };
    eventManager.addEventListener(
      instance.rootElement,
      'mousedown',
      instance.htMultiSelectArrowListener
    );

    // We need to unbind the listener after the table has been destroyed
    instance.addHookOnce('afterDestroy', function () {
      eventManager.destroy();
    });
  }
}

export default multiSelectRenderer;
