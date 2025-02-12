import {
  Directive,
  ElementRef,
  HostListener,
  Input,
} from '@angular/core';

@Directive({
  selector: '[ng-List-new]',
})
export class NgListNewDirective {
  @Input('ng-List-new') startIndex: number = 1;
  @Input() type;

  value: any[] = [];
  lastentered = true;
  index: number = -1;
  regex: RegExp = /[A-Za-z]{0,100000} (0|[1-9][0-9]{0,4}|100000): (.*?)+/g;
  constructor(public el: ElementRef) {}

  /**
   * Validate proper array of string
   * @param  {String} local a local array of string
   */
  optionValidation(local: any) {
    for (let i = 0; i < local.length; i++) {
      if (local[i].match(this.regex) === null) {
        this.index = i;
        break;
      }
    }
  }

  /**
   * If user delete the options list then we update the count
   */
  updateCountAfterEdit() {
    for (let i = this.index; i < this.value.length; i++) {
      const localVal = this.value[i]
        .substring(this.value[i].indexOf(':') + 1)
        ?.trim();
      this.value[i] = `${this.type} ${i + this.startIndex}: ` + localVal;
    }
  }

  /**
   * If value of textarea failed on validation then new val is updated in that index of array
   */
  optionsUpdater(): boolean {
    if (this.index >= this.value.length) {
      this.index = -1;
      return;
    }
    if (this.index !== -1 && this.value[this.index]?.length !== 0) {
      this.value.splice(
        this.index,
        1,
        `${this.type} ${this.index + this.startIndex}: ` +
          this.value[this.index]
      );
      this.updateCountAfterEdit();
      this.index = -1;
      this.optionValidation(this.value);
      return true;
    }

    // triggers when we delete any previous row
    if (this.index !== -1 && this.value[this.index].length === 0) {
      this.value.splice(this.index, 1);
      this.updateCountAfterEdit();
      this.index = -1;
      this.optionValidation(this.value);
      return true;
    }
    return false;
  }

  /**
   * Keypress event handler
   * @param  {Event} event will provide the selected element data
   */
  @HostListener('keydown', ['$event'])
  inputChanged($event) {
    const event = $event;
    let local = event.target.value.replace(/\r\n/g, '\n').trim().split('\n');
    // if first row deleted then add that row in the list
    if (
      this.value.length >= 0 &&
      this.value.length !== local.length &&
      this.value[0] !== local[0]
    ) {
      local = ['', ...local];
    }
    // if value then will validate the input
    if (this.value.length >= 0) this.optionValidation(local);
    // if up,down,left,right and space bar is pressed then dont update any thing
    if ([37, 38, 39, 40, 32].includes(event.keyCode)) {
      this.lastentered = false;
      return;
    }

    // if enter key is pressed twice then ignore the second enter key
    if (event.keyCode === 13 && this.lastentered) {
      event.target.value = this.value.join('\n');
      this.el.nativeElement.value = event.target.value;
      return;
    } else this.lastentered = false;

    // if no change is detected in last row then dont add new index to an array
    if (
      event.keyCode === 13 &&
      local[local.length - 1] === this.value[this.value.length - 1] &&
      this.index === -1
    ) {
      event.target.value = local.join('\n');
      this.el.nativeElement.value = event.target.value;
      return;
    }

    // ignore the value if empty string
    if (local.length === 1 && local[0] === '') {
      event.target.value = '';
      this.el.nativeElement.value = event.target.value;
      return;
    }

    // below local list is assigned to textarea value
    // and on pressed enter key value is updated
    this.value = local;
    if (this.value.length === 1 && this.value[0].length == 1)
      this.optionValidation(this.value);
    if (event.keyCode === 13) {
      while (this.index !== -1) {
        this.lastentered = true;
        const flag = this.optionsUpdater();
        if (this.value[this.value.length - 1].match(this.regex) !== null) {
        } else if (!flag) {
          this.value[this.value.length - 1] =
            `${this.type} ${this.value.length - 1 + this.startIndex}: ` +
            this.value[this.value.length - 1];
        }
        event.target.value = this.value.join('\n').trim();
        this.el.nativeElement.value = event.target.value;
      }
    }
  }
}
