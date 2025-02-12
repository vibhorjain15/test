import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[numericdiff]',

})
export class NumericDiffDirective implements OnInit {
  @Input() current:any = '';
  @Input() previous:any = '';

  constructor(
    private readonly elementRef: ElementRef
  ) {}
  ngOnInit(): void {
    this.current = this.current ? this.current : '';
    this.previous = this.previous ? this.previous : '';
    this.render();
  }

  render() {
    if (this.current != null && this.previous != null) {
      if(this.previous){
        let NumCurPre = ((this.current) - this.previous)/this.previous;
        let toFixedDigit = (Number(NumCurPre) * 100).toFixed(2)
        let className = '';
        if((NumCurPre) > 0){
          className = 'text-success'
        }else if((NumCurPre) < 0){
          className = 'text-danger'
        }
        if(this.current != this.previous){
          let plus = NumCurPre > 0 ? '<span>+</span>' : '';
          return this.elementRef.nativeElement.innerHTML = `<span class=${className}>${plus}${toFixedDigit}%</span>`
        }else if(this.current == this.previous){
          return this.elementRef.nativeElement.innerHTML = `<span>None</span>`
        }
      }else if(!this.previous){
        if(this.current == '' || this.current==null){
          return this.elementRef.nativeElement.innerHTML = `<span class="text-success">0%</span>`
        }else if(this.current!='' || this.current!=null){
          return this.elementRef.nativeElement.innerHTML = `<span class="text-success">100%</span>`
        }
      }
    }
  }
}
