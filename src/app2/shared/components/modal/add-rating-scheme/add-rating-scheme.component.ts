import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { RatingService } from 'src/app2/services/rating-definition/rating-defination.service';
import {
  IRatingScales,
  IRatingTypes,
} from 'src/app2/services/rating-definition/rating-definition.types';
import { uniqueValidator } from 'src/app2/services/rating-definition/rating-definition.utils';
import { noHtmlValidator, noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'add-rating-scheme',
  templateUrl: './add-rating-scheme.component.html',
})
export class RatingSchemeModal implements OnInit {
  @Input() ratingObject: IRatingTypes;
  @Input() allRatings: string[];
  @Input() onSuccess: any;
  scalesTypes: IRatingScales[] = [];
  ratingForm: FormGroup;
  isEdit: boolean = false;
  loading: boolean = false;

  constructor(
    private readonly RatingService: RatingService,
    private readonly toastrService: ToastrService
  ) {}

  ngOnInit() {
    this.scalesTypes = this.RatingService.ratingScales;

    if (this.ratingObject) {
      this.isEdit = true;
      const index = this.allRatings.indexOf(this.ratingObject.name);
      this.allRatings.splice(index, 1);
      this.ratingForm = new FormGroup({
        name: new FormControl(this.ratingObject.name, [
          Validators.required,
          uniqueValidator(this.allRatings),
          noWhitespaceValidator,
        ]),
        rating_scale_id: new FormControl(this.ratingObject.rating_scale_id, [
          Validators.required,
        ]),
      });
      this.ratingForm.controls['rating_scale_id'].disable({ onlySelf: true });
    } else {
      this.ratingForm = new FormGroup({
        name: new FormControl('', [
          Validators.required,
          uniqueValidator(this.allRatings),
          noWhitespaceValidator,
          noHtmlValidator
        ]),
        rating_scale_id: new FormControl(null, [Validators.required]),
      });
    }
  }

  save(callback) {
    validateAllFormFields(this.ratingForm);
    if (
      this.ratingForm.valid &&
      !this.allRatings.includes(this.ratingForm.value.name)
    ) {
      this.loading = true;
      const { name, rating_scale_id } = this.ratingForm.value;
      if (this.isEdit) {
        const params = { ...this.ratingObject, name };
        this.RatingService.updateRatingtype(
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => {
            this.loading = false;
          }
        );
      } else {
        let params = { name, rating_scale_id };
        this.RatingService.createRatingtype(
          params,
          () => {
            this.loading = false;
            this.onSuccess(params);
            callback();
          },
          () => {
            this.loading = false;
          }
        );
      }
    } else {
      const nameControl = this.ratingForm.controls.name;
      if (nameControl?.errors?.maxlength) {
        this.toastrService.error('A rating with same name already exists');
      }
    }
  }
}
