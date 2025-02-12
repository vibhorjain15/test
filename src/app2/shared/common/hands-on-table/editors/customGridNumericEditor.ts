import Handsontable from 'handsontable';

export class GridNumericEditor extends Handsontable.editors.NumericEditor {
  createElements() {
    super.createElements();
    this.TEXTAREA = this.hot.rootDocument.createElement('input');
    this.TEXTAREA.setAttribute('type', 'text');
    this.TEXTAREA.setAttribute('data-hot-input', true as any);
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0 as any;
    this.textareaStyle.height = 0 as any;

    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }

  getValue() {
    let regex = new RegExp(',', 'g');
    return (this.TEXTAREA as HTMLInputElement).value
      .toString()
      .replace(regex, '');
  }
}
