import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-tfa-intro',
  templateUrl: './tfa-intro.component.html',
  styleUrls: ['./tfa-intro.component.css'],
})
export class TfaIntroComponent implements OnInit {
  setup_app_on_mobile = false;

  constructor(private readonly routerService: RouterService) {}

  ngOnInit(): void {}

  redirectTo2FASetup() {
    this.routerService.navigate(
      'app.settings.security.two_factor_authentication.setup'
    );
  }
}

