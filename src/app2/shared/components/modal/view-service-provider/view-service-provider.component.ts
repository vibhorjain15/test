import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { fromEvent } from 'rxjs';
import { SSOProfileService } from 'src/app2/services/sso-profile/sso-profile.service';
import { ISsoProvider } from 'src/app2/services/sso-profile/sso-profile.type';

@Component({
  selector: 'view-service-provider',
  templateUrl: './view-service-provider.component.html',
})
export class ViewServiceProviderModal
  implements OnInit, AfterViewInit, OnDestroy
{
  isTextCopied = false;
  subscriptions = [];
  constructor(private readonly SSOProfileService: SSOProfileService) {}
  viewProForm: FormGroup;
  ngOnInit() {
    this.viewProForm = new FormGroup({
      acs_url: new FormControl(''),
      audience: new FormControl(''),
      logout_url: new FormControl(''),
    });
    this.SSOProfileService.getSamlProvider(
      (res: ISsoProvider) => {
        this.viewProForm = new FormGroup({
          acs_url: new FormControl(res.acs_url),
          audience: new FormControl(res.audience),
          logout_url: new FormControl(res.logout_url),
        });
      },
      () => {}
    );
  }

  ngAfterViewInit(): void {
    const button = document.querySelectorAll('.btn-sm');
    const mouseEnter$ = fromEvent(button, 'mouseenter').subscribe((x) => {
      const button = x.target as HTMLElement;
      button.classList.add('btn-primary');
      button.classList.remove('btn-default');
    });
    const mouseLeave$ = fromEvent(button, 'mouseleave').subscribe((x) => {
      const button = x.target as HTMLElement;
      button.classList.add('btn-default');
      button.classList.remove('btn-primary');
    });
    this.subscriptions = [mouseEnter$, mouseLeave$];
  }

  ngOnDestroy(): void {
    if (this.subscriptions.length) {
      this.subscriptions.forEach((x) => {
        x.unsubscribe();
      });
    }
  }

  hightLightText(containerid: any) {
    if ((document as any).selection) {
      const range = (document.body as any).createTextRange();
      range.moveToElementText(document.getElementById(containerid));
      range.select();
    } else if (window.getSelection) {
      const range = document.createRange();
      range.selectNode(document.getElementById(containerid));
      window.getSelection().removeAllRanges();
      setTimeout(() => {
        window.getSelection().addRange(range);
      });
    }
  }
}
