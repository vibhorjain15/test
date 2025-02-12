import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[diligenceTypeIcon]'
})
export class DiligenceTypeIconDirective implements OnInit {
  @Input('icon-size') iconSize;
  @Input('diligence-type-icon') icon;
  private icon_map: object;

  constructor(private elementRef: ElementRef) {
    this.icon_map = {
      'dd_doc': 'notepad',
      'dd_new': 'file-add',
      'dd_ongoing': 'clock-o',
      'dd_event_related': 'thunder',
      'dd_profile': 'manager'
    };
  }

  ngOnInit(): void {
    this.genarateHtml(this.icon);
  }

  genarateHtml(type) {
    if (!type) {
      return;
    }
    let html = '';
    html += '<i ';
    html += 'name="' + this.icon_map[type] + '"';
    html += 'class="dvi dvi-' + this.icon_map[type] + ' fa-' + this.iconSize + '"';
    html += 'placement="top"';
    html += this.iconSize ? 'size="' + this.iconSize + '"' : '';
    html += '></i>';
    const nativeElement = this.elementRef.nativeElement;
    nativeElement.innerHTML = html;
  }

}
