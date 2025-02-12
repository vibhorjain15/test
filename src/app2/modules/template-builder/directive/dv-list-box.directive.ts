import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[dvListBox]',
})
export class DvListBoxDirective {
  constructor(private elementRef: ElementRef) {}
  @Input() color: string = ' #bfbfbf';
  @Input() borderRadius: string = '0px';
  @Input() padding?: 'small' | 'medium' | 'big' | 'none' = 'none';
  paddingMap = {
    none: '',
    small: '5px',
    medium: '10px',
    big: '15px',
  };
  colorMap = {
    default: '#bfbfbf',
    primary:''
  };
  ngOnInit() {
    let css = `
      width: inherit;
      border: 1px solid ${this.color};
      margin: 5px 0;
      border-radius: ${this.borderRadius};
      padding: ${this.paddingMap[this.padding]};
      `;
    this.elementRef.nativeElement.setAttribute('style', css);
  }
}
