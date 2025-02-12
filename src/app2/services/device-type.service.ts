import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DeviceService implements OnDestroy {
  private resizeSubscription: Subscription | undefined;
  private viewportWidth: number | undefined;
  private isMobile = false;
  private isTablet = false;
  private isDesktop = false;
  private isWeb = false;

  constructor() {
    this.initResizeListener();
    this.updateDeviceType();
  }

  private initResizeListener() {
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.updateDeviceType();
      });
  }

  private updateDeviceType() {
    this.viewportWidth = window.innerWidth;
    this.isMobile = this.viewportWidth < 576;
    this.isTablet = this.viewportWidth >= 576 && this.viewportWidth < 992;
    this.isDesktop = this.viewportWidth >= 992 && this.viewportWidth < 1200;
    this.isWeb = this.viewportWidth >= 1200;
  }

  get isMobileDevice(): boolean {
    return this.isMobile;
  }

  get isTabletDevice(): boolean {
    return this.isTablet;
  }

  get isDesktopDevice(): boolean {
    return this.isDesktop;
  }

  get isWebDevice(): boolean {
    return this.isWeb;
  }

  ngOnDestroy() {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}
