import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ReviewDefinitionsService } from 'src/app2/services/review-definitions/review-definitions.service';
import { RouterService } from 'src/app2/services/router.service';
import { Definition } from 'src/app2/shared/models/review-definitions.model';

@Component({
  selector: 'app-new-review-definition',
  templateUrl: './new-review-definition.component.html',
  styleUrls: ['./new-review-definition.component.css'],
})
export class NewReviewDefinitionModal implements OnInit {
  @Input() definitions: Definition[] = [];
  @Input() success;
  @Input() type: 'new' | 'edit' = 'new';
  @Input() currDef: Definition;
  createDisabled: boolean;
  definitionName: string;
  newDefinition: Definition = {} as Definition;
  questionFilter;
  questionFilterList;
  nameError: boolean = true;
  loader: boolean;
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly router: RouterService,
    private readonly reviewService: ReviewDefinitionsService
  ) {}

  ngOnInit(): void {
    if (this.type === 'edit') this.definitionName = this.currDef.name.trim();
    this.reviewService.getReviewFilters().subscribe((filters: any) => {
      this.questionFilterList = filters;
      this.questionFilter = 4;
    });
  }

  createDefinition(close) {
    if (
      !this.nameError &&
      this.definitionName &&
      this.definitionName.length < 50
    ) {
      this.loader = true;
      this.newDefinition.name = this.definitionName;
      this.newDefinition.review_filter_id = this.questionFilter;
      this.http.post('review_definitions', this.newDefinition).subscribe(
        (res: Definition) => {
          this.toaster.success('Review Definition Created');
          this.success(res);
          this.loader = false;
          this.router.navigateWithParams(
            'app.firm.settings.review_definitions.details',
            { reviewId: res.id }
          );
          close();
        },
        (err) => (this.loader = false)
      );
    }
  }

  updateDefinitionName(close) {
    if (
      !this.nameError &&
      this.definitionName &&
      this.definitionName.length < 50
    ) {
      this.success(this.definitionName);
      close();
    }
  }

  checkNameValid(name) {
    this.definitionName = name.trim();
    if (
      this.definitions.find(
        (def) =>
          def.name.toLocaleLowerCase().trim() ===
          name.toLocaleLowerCase().trim()
      )
    )
      this.nameError = true;
    else this.nameError = false;
  }

  handleDefinitionClick(close) {
    if (this.type === 'new') this.createDefinition(close);
    else this.updateDefinitionName(close);
  }
}
