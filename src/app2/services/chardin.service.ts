import { Injectable } from '@angular/core';
import * as angular from 'angular';
import * as $ from 'jquery';
import { Chardin } from 'chardin.ts';

@Injectable({
  providedIn: 'root',
})
export class ChardinService {
  active: boolean;
  chardin: Chardin;

  show(config, onShow = null, onHide = null) {
    const $body = $('body');
    const chardin_visible_class = 'chardinjs-show-element';
    const chardin_noscroll_class = 'chardin-noscroll';

    const init = () => {
      $body.addClass(chardin_noscroll_class);
      this.chardin = new Chardin(document.querySelector('body'));
      if (config.reveal_menubar) {
        $body.scrollTop(0);
        setTimeout(() => this.chardin.start(), 301);
      } else {
        this.chardin.start();
      }
      if (angular.isFunction(onShow)) {
        onShow();
      }
      this.active = true;

      $body.on('chardinJs:stop', () => {
        config.intros?.forEach((intro_config) => {
          const $target = $(intro_config.target);
          $target.attr('data-intro', null);
          if (intro_config.position) {
            $target.attr('data-position', null);
          }
          if (intro_config.visible_elements) {
            $(intro_config.visible_elements).removeClass(chardin_visible_class);
          }
        });
        $body.removeClass(chardin_noscroll_class);
        if (angular.isFunction(onHide)) {
          onHide();
        }
        this.active = false;
      });
    };

    config.intros?.forEach((intro_config) => {
      const $target = $(intro_config.target);
      $target.attr('data-intro', intro_config.intro);
      if (intro_config.position) {
        $target.attr('data-position', intro_config.position);
      }
      if (intro_config.visible_elements) {
        $(intro_config.visible_elements).addClass(chardin_visible_class);
      }
    });

    if (config.scroll_to_target) {
      const top =
        $(config.intros[0].target).offset().top - (config.scroll_offset || 0);
      $body.animate({ scrollTop: top }, init);
    } else {
      init();
    }
  }

  hide() {
    if (!this.active) {
      return;
    }
    const $body = $('body');
    this.chardin.stop();
    $body.off('chardinJs:stop');
  }
}
