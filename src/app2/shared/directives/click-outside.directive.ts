import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Directive, ElementRef, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';

import { Subscription, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Directive({
  selector: '[appClickOutside]'
})
export class ClickOutsideDirective implements AfterViewInit, OnDestroy {
  @Output() clickOutside = new EventEmitter<Event>();

  clickSubscription: Subscription | undefined;

  constructor(
    private element: ElementRef,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  ngAfterViewInit(): void {
    this.clickSubscription = fromEvent(this.document, 'click').pipe(
      filter((event: Event) => !this.isClickedInside(event.target as HTMLElement))
    ).subscribe((event: Event) => {
      this.clickOutside.emit(event);
    });
  }

  ngOnDestroy(): void {
    this.clickSubscription?.unsubscribe();
  }

  isClickedInside(targetElement: HTMLElement): boolean {
    return this.element.nativeElement === targetElement
      || this.element.nativeElement.contains(targetElement);
  }
}
