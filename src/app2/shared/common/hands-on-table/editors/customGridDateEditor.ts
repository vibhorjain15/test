import Handsontable from 'handsontable';
import * as Pikaday from 'pikaday';

export class GridDateEditor extends Handsontable.editors.TextEditor {
  createElements() {
    super.createElements();
    this.TEXTAREA = this.hot.rootDocument.createElement('textarea');
    this.TEXTAREA.setAttribute('data-hot-input', true as any);
    this.textareaStyle = this.TEXTAREA.style;
    // Apply other styles dynamically
    this.textareaStyle.width = '141px';
    this.textareaStyle.height = '23px';
    this.textareaStyle.fontSize = '13px';
    this.textareaStyle.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Helvetica Neue", Arial, sans-serif';
    this.textareaStyle.resize = 'none';
    this.textareaStyle.minWidth = '141px';
    this.textareaStyle.maxWidth = '141px';
    this.textareaStyle.overflowY = 'hidden';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}
