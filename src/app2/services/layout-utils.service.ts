import { Injectable, OnInit } from '@angular/core';
import * as $ from 'jquery';
import { ToggleWritetoUs } from '../store/user/user.action';
import { Store } from '@ngxs/store';

@Injectable({
  providedIn: 'root',
})
export class LayoutUtilsService implements OnInit {
  constructor(private readonly store: Store) {}
  root;

  ngOnInit(): void {}

  initializeRootScope() {}

  toggleFeedbackPanel() {
    this.store.dispatch(new ToggleWritetoUs());
  }

  enterFullscreenMode(element) {
    $('body').addClass('fullscreen-mode');
    element.classList.add('fullscreen-target');
  }

  exitFullscreenMode(element) {
    $('body').removeClass('fullscreen-mode');
    element.classList.remove('fullscreen-target');
  }

  triggerHelp() {
    // TODO: Replace jQuery, $
    /* const evt = jQuery.Event('keypress');
    evt.keyCode = 63;
    $('body').trigger(evt); */
  }
}
