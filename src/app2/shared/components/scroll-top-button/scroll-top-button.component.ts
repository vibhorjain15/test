import {
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ScrollTopButtonService } from './scroll-top-button.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'scroll-top-button',
  templateUrl: './scroll-top-button.component.html',
  styleUrls: ['./scroll-top-button.component.css'],
})
export class ScrollTopButtonComponent implements OnInit, OnDestroy {
  @Input() container: any;
  @Input() position: 'fixed' | 'sticky' = 'sticky'; // Determines whether to stick to the base element relatively and show up on DOM or dont occupy any space on DOM and be fixed

  showTopButton: boolean = false;
  sub: Subscription;
  constructor(private readonly scrollTopService: ScrollTopButtonService) {
    this.onContainerScroll = this.onContainerScroll.bind(this);
  }

  onContainerScroll() {
    if (this.container) {
      this.scrollFunction();
    }
  }
  // Show or hide the button based on scroll position
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrollFunction();
  }

  ngOnInit() {
    this.sub = this.scrollTopService.scrollToTop.subscribe(() => {
      this.scrollToTop();
    });
    if (this.container) {
      this.container.addEventListener('scroll', this.onContainerScroll);
    }
  }

  // Scroll to the top when the button is clicked
  scrollToTop() {
    this.scrollTopService.onScrollUp.emit();
    setTimeout(() => {
      if (this.container) {
        this.scrollTop(this.container);
        if (this.container.scrollTop == 0) {
          this.scrollTop(window);
        }
      } else {
        this.scrollTop(window);
      }
    }, 400);
  }

  scrollTop(container) {
    container.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  private scrollFunction() {
    const element = document.getElementById('scroll-top');
    if (
      (this.container && this.container.scrollTop > 20) ||
      document?.body?.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      element.classList.add('showButton');
    } else {
      element?.classList.remove('showButton');
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
