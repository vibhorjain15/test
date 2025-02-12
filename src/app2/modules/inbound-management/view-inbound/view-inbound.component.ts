import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';

@Component({
  selector: 'app-view-inbound',
  templateUrl: './view-inbound.component.html',
  styleUrls: ['./view-inbound.component.css'],
})
export class ViewInboundComponent implements OnInit {
  loading = false;
  panelHeadingControls: PanelControl[] = [];
  constructor(private readonly routerService: RouterService) {}

  ngOnInit(): void {
    this.loading = true;
    this.setPanelHeadingControls();
  }

  navigateNewOpportunity() {
    this.routerService.navigate(`app.firm.settings.configure_opportunity`);
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'Add New Opportunity',
        handleClick: this.navigateNewOpportunity.bind(this),
        tooltip: 'Add New Opportunity',
        leftIcon: 'plus',
      },
    ];
  }
}
