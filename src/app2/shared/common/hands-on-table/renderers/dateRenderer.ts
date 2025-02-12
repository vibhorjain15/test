import Handsontable from 'handsontable';
import * as moment from 'moment';
import * as Pikaday from 'pikaday';

// function pikadayRenderer(instance, td, row, col, prop, value, cellProperties) {
//   Handsontable.cellTypes.date.renderer(instance, td, row, col, prop, value, cellProperties);
//   const tableMeta: any = Object.getPrototypeOf(cellProperties);
//   const input = document.createElement('input');
//   input.type = 'text';
//   input.id = prop;
//   input.value = value;
//   input.placeholder = tableMeta.placeholder;
//   input.autocomplete = 'off';
//   input.style.border = 'none';
//   input.style.background = 'none';
//   input.style.outline = 'none';
//   input.style.padding = '0';
//   input.style.margin = '0';
//   input.style.boxShadow = 'none';
//   input.style.webkitAppearance = 'none';
//   input.style.appearance = 'none';
//   input.style.font = 'inherit';
//   input.style.color = 'inherit';
//   input.style.width = '100%';
//   td.innerHTML = ``;
//   td.appendChild(input);
//   new Pikaday({
//     field: input,
//     position: 'bottom left',
//     onSelect: function (date) {
//       input.value = moment(date).format(tableMeta.dateFormat);
//       instance.setDataAtCell(row, col, input.value);
//     },
//   });
//   return td;
// }

// export default pikadayRenderer;

let pikadayRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  const tableMeta: any = Object.getPrototypeOf(cellProperties);
  const input = document.createElement('input');
  input.type = 'text';
  input.id = prop;
  input.value = value;
  input.placeholder = tableMeta.placeholder;
  input.autocomplete = 'off';
  input.style.border = 'none';
  input.style.background = 'none';
  input.style.outline = 'none';
  input.style.padding = '0';
  input.style.margin = '0';
  input.style.boxShadow = 'none';
  input.style.webkitAppearance = 'none';
  input.style.appearance = 'none';
  input.style.font = 'inherit';
  input.style.color = 'inherit';
  input.style.width = '100%';
  td.innerHTML = ``;
  td.appendChild(input);
  // input.oncontextmenu = function (event) {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   return false;
  // };
  const picker = new Pikaday({
    field: input,
    onSelect: function (date) {
      td.innerHTML = input.value;
      instance.setDataAtCell(row, col, input.value);
    },
    // onClose: function () {
    //   picker.destroy(); // Ensure Pikaday instance is cleaned up after close
    // },
  });
  return td;
};

export default pikadayRenderer;
