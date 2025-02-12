import { Injectable } from '@angular/core';
import { ApiRoutes } from './api-routes.config';

@Injectable()

export class App {

  constructor(
    private apiRoutes: ApiRoutes,
  ) { }

  get getApiRoutes(): any {
    return this.apiRoutes;
  }

}
