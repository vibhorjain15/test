import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';
declare var $: any;

@Directive({
  selector: '[appDvNavTabsDropdown]'
})
export class DvNavTabsDropdownDirective implements OnInit {

  constructor(private readonly renderer: Renderer2, private readonly elementRef: ElementRef) { }

  ngOnInit(): void {
    const nativeElement = this.elementRef.nativeElement;
    this.renderer.addClass(nativeElement, `nav-tabs-dropdown`);

    this.renderer.listen(`li:not('.active') a`, 'click', (event) => {
      $(this).closest('ul').removeClass('open');
    });

    this.renderer.listen(`li.active a`, 'click', (event) => {
      $(this).closest('ul').removeClass('open');
    });

  }

}
