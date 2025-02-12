import { Directive, ElementRef, Input } from '@angular/core';
import * as Humanize from "node_modules/humanize-plus/dist/humanize.js"

@Directive({
  selector: '[humanize]'
})
export class HumanizeDirective {
  @Input() humanize: any;
  @Input() humanizeInput: any;
  constructor(private element: ElementRef) { }

  ngOnInit(): void {
    const nativeElement = this.element.nativeElement;
    if (!this.humanizeInput) {
      return;
    }
    return nativeElement.innerHTML = Humanize.compactInteger(this.humanizeInput, 2)
  }

}
