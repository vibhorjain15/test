import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { RouterService } from 'src/app2/services/router.service';
import {
  DeleteTemplateState,
  GetCategories,
  GetFrequency,
  GetTemplateInfo,
  SetTemplateId,
} from '../../store/template-builder.action';
import { TemplateState } from '../../store/template-builder.state';
import { take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { CacheUtil } from 'src/app2/modules/questionnaire/service/cache.service';
import { TemplateService } from 'src/app2/apis/template/template.service';

@Component({
  selector: 'new-template-header',
  templateUrl: './template-header.component.html',
  styleUrls: ['./template-header.component.css'],
})
export class TemplateHeaderPageComponent implements OnInit, OnDestroy {
  @Select(TemplateState.getTemplateID) templateId;
  constructor(
    private readonly store: Store,
    private readonly router: RouterService,
    private routerState: ActivatedRoute,
    private cache: CacheUtil,
    private template: TemplateService
  ) {}
  ngOnInit(): void {
    this.store.dispatch(
      new SetTemplateId(
        +this.router.getState(this.routerState).params.templateId
      )
    );
    this.templateId.pipe(take(2)).subscribe((id) => {
      if (id) {
        this.store
          .dispatch(new GetTemplateInfo())
          .subscribe(() => this.store.dispatch(new GetCategories()));
      }
    });
    this.store.dispatch(new GetFrequency());
  }
  ngOnDestroy(): void {
    this.cache.clearCache();
    this.template.clearCache();
    this.store.dispatch(new DeleteTemplateState());
  }
}
