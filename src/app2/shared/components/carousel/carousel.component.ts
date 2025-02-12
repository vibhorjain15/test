import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { CarouselDetail } from '../../models/carousel.model';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit, OnDestroy {
  @Input() contents: Array<CarouselDetail> = [];
  @Input() selectedIndex: number = 0;
  @Input() indicators: boolean = true;
  @Input() controls: boolean = true;
  @Input() autoSlide: boolean = false;
  @Input() slideInterval: number = 3000; // default 3 seconds

  interval: NodeJS.Timeout;

  constructor() { }

  ngOnInit(): void {
    if (this.autoSlide) {
      this.autoSlideImages();
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
    this.interval = null;
  }

  autoSlideImages(): void {
    this.interval = setInterval(() => {
      this.onNextClick();
    }, this.slideInterval);
  }

  setActiveContent(index: number): void {
    this.selectedIndex = index;
  }

  onPreviousClick(): void {
    if (this.selectedIndex === 0) {
      this.selectedIndex = this.contents.length - 1;
    } else {
      this.selectedIndex--;
    }
  }

  onNextClick(): void {
    if (this.selectedIndex === (this.contents.length - 1)) {
      this.selectedIndex = 0;
    } else {
      this.selectedIndex++;
    }
  }

  trackByUrl(index: number, item: CarouselDetail): string {
    return item.src;
  }
}
