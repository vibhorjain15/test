import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
} from '@angular/core';
import { dvTabsList } from './dv-tabs.model';
import { UserModel } from 'src/app2/store/user/user.model';
import { SizeType } from '../../themes/size.theme';

@Component({
  selector: 'dv-tabs',
  templateUrl: './dv-tabs.component.html',
  styleUrls: ['./dv-tabs.component.css'],
})
/*
  This component is a common navigation tab component.
  Inputs
    1. Lists - Accepts list of heading to be shown in a page;
    2. User - User data
*/
export class DvTabsComponent implements OnInit {
  @Input() list: dvTabsList[] = [];
  @Input() User: UserModel;
  @Input() loading: boolean = false;
  @Input() size: SizeType = 'heading';
  @Input() showArrows: boolean = true;
  @Input() preventScroll: boolean = false;
  @Input() canChangeLocally: boolean = true;
  @Input() justifyCenter: boolean = false; // for aligning all tab options in center
  @Output() onTabClick: EventEmitter<number> = new EventEmitter();
  @Output() onDisabledTabClick: EventEmitter<number> = new EventEmitter();
  @ViewChild('scrollableContent', { static: true })
  scrollableContent: ElementRef;
  @ViewChild('leftArrow', { static: true }) leftArrow: ElementRef;
  @ViewChild('rightArrow', { static: true }) rightArrow: ElementRef;
  private distance: number = 350;
  constructor(private elementRef: ElementRef) {}
  handleTabClick(link, index) {
    if (this.list[index].active) return;
    if (this.list[index].disabled) {
      this.onDisabledTabClick.emit(index);
      return;
    }
    if (this.canChangeLocally) {
      this.list.forEach((tab) => (tab.active = false));
      this.list[index].active = true;
    }

    this.onTabClick.emit(index);
  }
  ngOnInit(): void {
    setTimeout(() => {
      this.scrollToActiveAndFocus();
      // this.scrollToActive();
      // this.setFocusToActiveTab();
    }, 0);
  }
  scrollToActive() {
    let activeElement: any = document.getElementById('active-tab');
    if (
      activeElement &&
      this.scrollableContent.nativeElement.offsetWidth - 100 <
        activeElement.offsetLeft
    ) {
      this.scrollableContent.nativeElement.scrollTo({
        left: activeElement.offsetLeft,
      });
    }
    this.canShowIcons();
  }

  handleFirstClick() {
    this.scrollableContent.nativeElement.scrollTo({
      left: this.scrollableContent.nativeElement.scrollLeft - this.distance,
    });
    this.canShowIcons();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.canShowIcons();
  }

  handleLastClick() {
    this.scrollableContent.nativeElement.scrollTo({
      left: this.scrollableContent.nativeElement.scrollLeft + this.distance,
    });
    this.canShowIcons();
  }

  canShowIcons() {
    // Amount of time taken for smooth scroll
    setTimeout(() => {
      let { scrollLeft, scrollWidth, clientWidth } =
        this.scrollableContent.nativeElement;
      scrollLeft = Math.ceil(scrollLeft);
      if (this.showArrows) {
        this.leftArrow.nativeElement.style.display =
          scrollLeft > 0 ? 'flex' : 'none';
        this.rightArrow.nativeElement.style.display =
          scrollWidth - clientWidth > scrollLeft + 1 ? 'flex' : 'none';
      }
    }, 500);
  }

  onScroll() {
    //on each scroll check to show/hide arrow icons
    this.canShowIcons();
  }

  setFocusToActiveTab() {
    const activeTab = this.scrollableContent.nativeElement.querySelector(
      '.tab[id="active-tab"]'
    );
    if (activeTab) {
      activeTab.focus();
    }
  }

  scrollToActiveAndFocus() {
    const activeElement = this.scrollableContent.nativeElement.querySelector(
      '.tab[id="active-tab"]'
    );
    if (activeElement) {
      // Scroll to active tab
      const containerWidth = this.scrollableContent.nativeElement.offsetWidth;
      const activeTabWidth = activeElement.offsetWidth;
      const activeTabOffsetLeft = activeElement.offsetLeft;
      const scrollLeft = this.scrollableContent.nativeElement.scrollLeft;
      const activeTabVisible =
        activeTabOffsetLeft >= scrollLeft &&
        activeTabOffsetLeft + activeTabWidth <= scrollLeft + containerWidth;

      if (!activeTabVisible) {
        this.scrollableContent.nativeElement.scrollTo({
          left: activeTabOffsetLeft,
          behavior: 'smooth',
        });
      }

      // Set focus to active tab
      activeElement.focus({
        preventScroll: this.preventScroll,
      });
    }
    this.canShowIcons();
  }

  handleArrowKey(direction: string, event: KeyboardEvent) {
    event.preventDefault();
    const currentIndex = this.list.findIndex((tab) => tab.active);
    let nextIndex = currentIndex;

    if (direction === 'left') {
      nextIndex = currentIndex - 1;
      while (nextIndex >= 0 && !this.list[nextIndex].condition) {
        nextIndex--;
      }
    } else if (direction === 'right') {
      nextIndex = currentIndex + 1;
      while (nextIndex < this.list.length && !this.list[nextIndex].condition) {
        nextIndex++;
      }
    }

    if (nextIndex >= 0 && nextIndex < this.list.length) {
      this.handleTabClick(null, nextIndex);
    }
  }
}
