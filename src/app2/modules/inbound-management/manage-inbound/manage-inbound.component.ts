import { RouterService } from './../../../services/router.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-manage-inbound',
  templateUrl: './manage-inbound.component.html',
  styleUrls: ['./manage-inbound.component.css'],
})
export class ManageInboundComponent implements OnInit {
  showStepper = false;

  constructor(private readonly routerService: RouterService) {}

  ngOnInit(): void {}

  onShowStepper() {
    this.routerService.navigate(`app.firm.settings.configure_opportunity`);
  }

  onShowIntro() {
    this.showStepper = false;
  }
}

