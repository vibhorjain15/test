import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { UserService } from 'src/app2/services/user.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { UpdateFirstLoginUser } from 'src/app2/store/user/user.action';

@Component({
  selector: 'welcome-to-dv',
  templateUrl: './welcome-to-dv.component.html',
  styleUrls: ['./welcome-to-dv.component.css'],
})
export class WelcomeToDvComponent implements OnDestroy{
  lead_text: string;
  isInvestor: any;
  spinner_text = 'Loading the tutorial';
  loadingTour: boolean;
  is_manager: any;
  is_admin: any;
  divElement;
  redirectToState;
  redirectToParams;
  constructor(
    private readonly router: RouterService,
    private readonly Utils: UtilsService,
    private readonly ModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly renderer: Renderer2,
    private readonly userService: UserService,
    private readonly routerService: RouterService,
    private readonly store: Store,
  ) {}

  ngOnInit() {
    this.store.dispatch(new UpdateFirstLoginUser());
    this.isInvestor = this.Utils.isInvestor();
    this.is_manager = this.Utils.isManager();
    this.is_admin = this.Utils.isAdmin();
    if (this.isInvestor) {
      this.lead_text =
        'DiligenceVault allows you to Monitor, Analyze & Manage your investments through an interactive, secure and centralized platform.';
    } else {
      this.lead_text =
        'DiligenceVault empowers you to collaborate with your team, and reuse centralized content library to address investor DDQ / RFP / RFIs and Surveys.';
    }
    this.divElement = this.renderer.createElement('div');
    this.renderer.setAttribute(
      this.divElement,
      'class',
      'chardinjs-overlay fixed welcome-mask'
    );
    this.renderer.appendChild(document.body, this.divElement);
  }
  skipTutorial() {
    if (!this.Utils.getSkipIntro()) {
      this.userService.skipTour().subscribe(
        (response) => {
          this.router.navigate('app/home');
        },
        (error) => {
          this.toaster.error('', 'Something went wrong. Please try again.');
          if (this.redirectToState)
            this.routerService.navigateWithParams(
              this.redirectToState,
              this.redirectToParams
            );
          else this.router.navigate('app/home');
        }
      );
    } else {
      if (this.redirectToState)
        this.routerService.navigateWithParams(
          this.redirectToState,
          this.redirectToParams
        );
      else this.router.navigate('app/home');
    }
  }

  exploreDV() {
    window.open('https://app.storylane.io/share/o29issisoqou', '_blank');
    this.router.navigate('app/home');
  }

  removeMask() {
    this.renderer.removeChild(document.body, this.divElement);
  }

  inviteTeamMember() {
    setTimeout(() => {
      this.ModalFactory.invoke('new-user');
    }, 1);
  }
  
  ngOnDestroy(): void {
    this.removeMask();
  }
}
