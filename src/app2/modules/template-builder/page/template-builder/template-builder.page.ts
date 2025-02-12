import { Component } from '@angular/core';

@Component({
  selector: 'templte-builder',
  template: `<div class="row clearfix">
    <div class="col-md-12">
      <new-template-header></new-template-header><router-outlet></router-outlet>
    </div>
  </div> `,
})
export class TemplateBuilderComponent {}
