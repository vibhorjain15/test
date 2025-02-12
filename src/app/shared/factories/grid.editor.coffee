GridNumericEditor = Handsontable.editors.NumericEditor.prototype.extend()

GridNumericEditor.prototype.createElements = ->
    Handsontable.editors.NumericEditor.prototype.createElements.apply(this,arguments)
    this.TEXTAREA = this.hot.rootDocument.createElement('input');
    this.TEXTAREA.setAttribute('type', 'text');
    this.TEXTAREA.setAttribute('data-hot-input', true)
    this.textareaStyle = this.TEXTAREA.style
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;

    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);

GridNumericEditor.prototype.getValue = ->
    regex = new RegExp(',', 'g')
    value = this.TEXTAREA.value.toString().replace(regex,'')
    value

Handsontable.editors.registerEditor('GridNumericEditor',GridNumericEditor);