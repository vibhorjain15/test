import { Component, Input, OnInit } from '@angular/core';
import { ModalService } from 'src/app2/services/modal.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.css'],
})
export class MenuItemComponent implements OnInit {
  @Input() stateName;
  @Input() stateParams;
  @Input() subMenuItem;
  @Input() customClass;
  @Input() is_active;
  @Input() menu_item;
  @Input() modalName;
  @Input() modal_options;
  uiSref: any;
  is_freeSubscription: any;

  constructor(
    private readonly Utils: UtilsService,
    private readonly routerService: RouterService,
    private readonly ModalFactory: ModalService
  ) {}

  ngOnInit(): void {
    this.uiSref = this.stateName;
    this.is_freeSubscription = this.Utils.isFreeSubscription();
    if (this.stateParams) {
      this.uiSref += `(${this.stateParams})`;
    }
  }
  closeMenu() {
    // Handling Routing/Modal
    if (this.modalName) {
      this.ModalFactory.invokeModal(this.modalName, this.modal_options);
    } else {
      this.routerService.navigate(this.uiSref);
    }
  }
}
