import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeatmapService {
  private chartData: any;

  setChartData(data: any) {
    this.chartData = data;
  }

  getChartData() {
    return this.chartData;
  }

  getColorFill(chartObj, d3ColorScales) {
    const d3Scale = d3ColorScales.get(chartObj.chart.rating_scale_id);
    return d3Scale(chartObj.chart.colorVal);
  }

  getDisplayText(label: string): string {
    let text = label ? label.replace(/<.*?>/g, '').toUpperCase() : '';
    if (text.length > 100) {
      text = text.substring(0, 100).concat('...');
    }
    return text;
  }
}
