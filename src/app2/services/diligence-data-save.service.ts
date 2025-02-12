import { Injectable } from '@angular/core';

@Injectable()
export class DiligenceDataSaveService {
  projectsParams;

  setProjectsParams(params) {
    this.projectsParams = params;
  }

  getProjectsParams() {
    return this.projectsParams;
  }

  resetProjectsParams() {
    this.projectsParams = null;
  }
}
