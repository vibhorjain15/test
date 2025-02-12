import { Component, Renderer2 } from '@angular/core';
import { Store } from '@ngxs/store';
import { RouterService } from 'src/app2/services/router.service';
import { UpdateFirstLoginUser } from 'src/app2/store/user/user.action';

@Component({
  selector: 'welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent {
  stateParams: any;
  help_mode: any;
  divElement;
  constructor(
    private readonly router: RouterService,
    private readonly store: Store,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit() {
    // TODO: Add updateFirstLogin
    this.store.dispatch(new UpdateFirstLoginUser());
    this.stateParams = this.router.getState().params;
    this.help_mode = this.router.getState().params.help;

    this.divElement = this.renderer.createElement('div');
    this.renderer.setAttribute(
      this.divElement,
      'class',
      'chardinjs-overlay fixed welcome-mask'
    );
    this.renderer.appendChild(document.body, this.divElement);
  }
  navigateToDashboard() {
    this.router.navigateAngular(`app/home`);
  }
  ngOnDestroy() {
    this.renderer.removeChild(document.body, this.divElement);
  }
}
