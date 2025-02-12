import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { TemplateModel } from '../../store/template-builder.model';

@Component({
  selector: 'rating-map',
  templateUrl: './rating-map.component.html',
  styleUrls: ['./rating-map.component.css'],
})
export class RatingMapComponent implements OnInit {
  type: 'question' | 'section' = 'question';
  ratingScales: any;
  selectedRatingObject: any;
  ratingScaleDefinition: any[] = [];
  width: number;
  loaderRatingScale: boolean;
  templateData: TemplateModel;
  loader: boolean = false;
  scaleForm;
  constructor(
    private readonly template: TemplateService,
    private readonly store: Store,
    private readonly router: RouterService,
    private readonly toast: ToastrService,
    private readonly modal: CustomModalService
  ) {}

  ngOnInit(): void {
    this.ratingScales = this.template.getTemplateRatingScale();
    this.templateData = this.store.selectSnapshot((state) => state.template);
    this.scaleForm = new FormGroup({
      scale: new FormControl(null, [Validators.required]),
    });
  }

  handleButton(type) {
    this.type = type;
  }
  handleChange(rating) {
    this.scaleForm.patchValue({
      scale: rating,
    });
    this.loaderRatingScale = true;
    this.selectedRatingObject = rating;
    this.template
      .getRatingScales(rating.id, rating.version)
      .subscribe((res: any) => {
        this.width = (res.length - 1) * 42;
        this.ratingScaleDefinition = res;
        this.ratingScaleDefinition.splice(0, 2); // remove N/A and N/R
        this.loaderRatingScale = false;
      });
  }
  submitRating(index) {
    for (let i = 0; i <= this.ratingScaleDefinition.length - 1; i++) {
      if (i <= index) this.ratingScaleDefinition[i].is_active = true;
      else this.ratingScaleDefinition[i].is_active = false;
    }
  }

  createRating(close) {
    this.loader = true;
    const payload = {
      rating_level: this.type,
      rating_scale_id: this.ratingScaleDefinition[0].rating_scale_id,
      template_id: this.templateData.templateId,
      template_version: this.templateData.template.templateInfo.version,
    };

    this.template.postRatingAutoMap(payload).subscribe(
      (response: any) => {
        this.router.navigateWithParams(
          'app.firm.settings.investment_rating.types',
          { rating_id: response.rating_scheme_id }
        );
        this.modal.close();
        this.loader = false;
        this.toast.success('Score definition created');
      },
      (error) => {
        this.loader = false;
      }
    );
  }

  handleRouteToRatingScales() {
    this.modal.close();
    this.router.navigate('app.firm.settings.investment_rating.scales');
  }
}
