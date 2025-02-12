import { Component, Input } from '@angular/core';

@Component({
  selector: 'return-table-preview',
  template: `
    <div>
      <table class="table table-bordered space-on-top-lg space-on-bottom-lg">
        <thead>
          <tr>
            <th style="color:white;background-color:#747474" class="text-center">Net Return</th>
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
            <th style="color:white;background-color:#747474" class="text-center">YTD</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="color:white;background-color:#747474" class="text-center">2020</td>
            <td class="text-center">2.10%</td>
            <td class="text-center">0.50%</td>
            <td class="text-center text-danger">(0.32%)</td>
            <td class="text-center">0.98%</td>
            <td class="text-center">0.11%</td>
            <td class="text-center">1.22%</td>
            <td class="text-center text-danger">(3.45%)</td>
            <td class="text-center">2.77%</td>
            <td class="text-center">4.55%</td>
            <td class="text-center">1.22%</td>
            <td class="text-center text-danger">(0.98%)</td>
            <td class="text-center">1.10%</td>
            <td style="color:white;background-color:#747474" class="text-center">10.02%</td>
          </tr>
          <tr>
            <td style="color:white;background-color:#747474" class="text-center">2019</td>
            <td class="text-center">1.45%</td>
            <td class="text-center text-danger">(2.50%)</td>
            <td class="text-center">1.32%</td>
            <td class="text-center">2.92%</td>
            <td class="text-center text-danger">(4.11%)</td>
            <td class="text-center">1.22%</td>
            <td class="text-center">0.45%</td>
            <td class="text-center">0.27%</td>
            <td class="text-center">5.55%</td>
            <td class="text-center text-danger">(0.22%)</td>
            <td class="text-center text-danger">(0.23%)</td>
            <td class="text-center">2.10%</td>
            <td style="color:white;background-color:#747474" class="text-center">8.18%</td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!printPreview">
        <dv-button
          btnType="default"
          tooltip="Takes you to profile view where you view/edit all track record and performance history"
        >
          View All Track Records
        </dv-button>
      </div>
    </div>
  `,
})
export class ReturnTablePreviewComponent {
  @Input() printPreview = false;
}
