import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'dv-show-more',
  templateUrl: './dv-show-more.component.html',
  styleUrls: ['./dv-show-more.component.css'],
})
export class DvShowMoreComponent implements OnInit, AfterViewInit {
  @Input() text: any = '';
  isCollapsed = false;
  canShow = false;
  constructor(private el: ElementRef) { }
  ngOnInit(): void {
    let imgTag = this.text.includes('<img ');
    if (imgTag) this.canShow = true;
    if (this.text.split('\n').length > 1) this.canShow = true;
  }

  ngAfterViewInit(): void {    
    setTimeout(() => {
      this.canShow = this.el.nativeElement.offsetHeight > 80 || this.canShow;
      if (this.canShow) {
        this.isCollapsed = true;
      }
    });
  }

  OnClickHandle() {
    this.isCollapsed = !this.isCollapsed;
  }
}
