import { Component, Input } from '@angular/core';

@Component({
  selector: 'aum-preview',
  template: `
    <div>
      <table class="table table-bordered space-on-top-lg space-on-bottom-lg">
        <thead>
          <tr>
            <th style="color:white;background-color:#747474" class="text-center">AUM</th>
            <th class="text-center">Jan</th>
            <th class="text-center">Feb</th>
            <th class="text-center">Mar</th>
            <th class="text-center">Apr</th>
            <th class="text-center">May</th>
            <th class="text-center">Jun</th>
            <th class="text-center">Jul</th>
            <th class="text-center">Aug</th>
            <th class="text-center">Sep</th>
            <th class="text-center">Oct</th>
            <th class="text-center">Nov</th>
            <th class="text-center">Dec</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="color:white;background-color:#747474" class="text-center">2020</td>
            <td class="text-center">5,100</td>
            <td class="text-center">5,250</td>
            <td class="text-center">5,130</td>
            <td class="text-center">5,150</td>
            <td class="text-center">4,900</td>
            <td class="text-center">4,880</td>
            <td class="text-center">4,756</td>
            <td class="text-center">5,120</td>
            <td class="text-center">5,200</td>
            <td class="text-center">5,400</td>
            <td class="text-center">5,300</td>
            <td class="text-center">5,500</td>
          </tr>
          <tr>
            <td style="color:white;background-color:#747474" class="text-center">2019</td>
            <td class="text-center">5,000</td>
            <td class="text-center">4,850</td>
            <td class="text-center">4,530</td>
            <td class="text-center">4,150</td>
            <td class="text-center">3,900</td>
            <td class="text-center">3,880</td>
            <td class="text-center">3,756</td>
            <td class="text-center">4,120</td>
            <td class="text-center">4,200</td>
            <td class="text-center">4,400</td>
            <td class="text-center">4,300</td>
            <td class="text-center">4,500</td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!printPreview">
        <dv-button
          btnType="default"
          tooltip="Takes you to profile view where you view/edit AUM history"
        >
          View All AUM History
        </dv-button>
      </div>
    </div>
  `,
})
export class AumPreviewComponent {
  @Input() printPreview = false;
}
