import { Component, OnInit } from '@angular/core';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ReRouteService } from 'src/app2/services/re-reoute.service';

@Component({
  selector: 'euc-route',
  template: '',
})
export class EucRouteComponent implements OnInit {
  constructor(
    private readonly customModalService: CustomModalService,
    private readonly reRoute: ReRouteService
  ) {}
  ngOnInit(): void {
    if(this.reRoute.routeToWelcome()) return
    if(this.reRoute.routeToHome()) return
    this.customModalService.invoke('euc-modal', {
      class: 'gray modal-md',
    });
  }
}
