import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-rating-custom-field-cell-renderer',
  templateUrl: './rating-custom-field-cell-renderer.component.html',
  styleUrls: ['./rating-custom-field-cell-renderer.component.css'],
})
export class RatingCustomFieldCellRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  name: string;
  score: number;
  tooltip: any = '';
  backgroundColor: any;
  textColor: any;
  constructor(private readonly Utils: UtilsService) {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  //expected data format from backend
  //params.value = [score, name, floorvalue of score, ceiling value of score ];
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (params.value) {
      this.name = params.value.field_value[1];
      this.score = params.value.field_value[0];
      this.backgroundColor = this.getBackgroundColor(params);
      this.textColor =
        this.Utils.isColorLightOrDark(this.backgroundColor, 200) == 'dark'
          ? 'white !important'
          : 'black !important';
      this.backgroundColor = this.backgroundColor + ' !important';
      this.tooltip =
        params.value.display_format == 'name'
          ? params.value.field_value[0]
          : params.value.display_format == 'score'
          ? params.value.field_value[1]
          : null;
    }
  }

  getBackgroundColor(params) {
    if (
      !params.value.field_value[3] ||
      Number.isInteger(params.value.field_value[0])
    ) {
      return params.value.field_value[2];
    } else {
      return this.Utils.getColorForEntityRating(
        params.value.field_value[0],
        params.value.field_value[2],
        params.value.field_value[3]
      );
    }
  }
}
