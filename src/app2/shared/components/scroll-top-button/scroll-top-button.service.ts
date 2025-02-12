import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScrollTopButtonService {
  onScrollUp: EventEmitter<any> = new EventEmitter();
  scrollToTop: EventEmitter<any> = new EventEmitter();
  constructor() {}
}
