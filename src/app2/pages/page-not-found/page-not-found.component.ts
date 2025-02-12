import { Component, OnInit } from '@angular/core';
import { ErrorHandlerService } from 'src/app2/services/error-handler.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'page-not-found',
  templateUrl: './page-not-found.component.html',
})
export class PageNotFoundComponent implements OnInit {
  constructor(
    private readonly routerService: RouterService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    let tags = {
      invalid_route: true,
    };
    this.errorHandler.handleError(
      `Url Invaild - ${this.routerService.getState()._routerState.url}`,
      { isUrl: true },
      null,
      false,
      true,
      tags
    );
    this.routerService.navigate('app/home');
  }
}
