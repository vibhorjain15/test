import { AutoScrollServiceService } from 'src/app2/services/auto-scroll-service.service';
import {
  Directive,
  Input,
  Output,
  SimpleChanges,
  OnInit,
  OnChanges,
} from '@angular/core';
@Directive({
  selector: '[autoScroll]',
})
export class AutoScrollDirective implements OnInit, OnChanges {
  private id = null;
  @Input() autoScrollDelayTime = 2500;

  constructor(
    private autoScrollService: AutoScrollServiceService
  ) {}

  ngOnInit() {
    if (this.id) {
      //Otherwise Angular throws error: Expression has changed after it was checked.
      setTimeout(() => {
        const findPosition = (obj): any => {
          var currenttop = 0;
          if (obj?.offsetParent) {
            do {
              currenttop += obj.offsetTop;
            } while ((obj = obj?.offsetParent));
            return [currenttop - 200];
          }
        };
        let element = document.getElementById(this.id);
        if (element) {
          window.scrollTo(0, findPosition(element));
          setTimeout(() => {
            element.style.background = '';
            element.style.transition = 'background 1s linear';
          }, 2000);
          element.style.background = '#fffac7';
          this.autoScrollService.afterScrollEvent.emit(true);
        } else {
          this.autoScrollService.afterScrollEvent.emit(false);
        }
      }, this.autoScrollDelayTime);
    } else {
      this.autoScrollService.afterScrollEvent.emit(false);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !changes.autoScroll?.isFirstChange() &&
      changes.autoScroll?.previousValue !== changes.autoScroll?.currentValue
    ) {
      this.ngOnInit();
    }
  }

  @Input() set autoScroll(id: boolean) {
    this.id = id;
  }
}
