import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { HeatMapType } from './heatmap.type';
import * as d3 from 'd3';
import { CANVAS } from './heatmap.constant';
import { UtilsService } from 'src/app2/services/utils.service';
import { HeatmapService } from 'src/app2/services/heatmap/heatmap.service';
@Directive({
  selector: '[dvHeatmap]',
})
export class DvHeatmapDirective implements OnInit, OnChanges {
  @Input('dvHeatmap') heatmapData: HeatMapType;
  @Input() colors: Map<number, Map<number, string>>; // rating scale id vs map of (index, color)
  @Input() isInverted: boolean = false;
  @Input() d3ColorScales: Map<number, any>; // rating scale id vs its d3Scale
  id: string;
  d3Data: any = [];
  ddd: any = {};
  isYAxis: boolean;
  maxWidth: number = 0;

  leftMaxWidth = 210;
  headerMaxWidth = 210;
  updatelabelbarHeight = 40;
  updateLeftlabelbarHeight = 40;

  totalWidth = this.leftMaxWidth;
  axis: any = {
    x: {},
    y: {},
  };
  constructor(
    private elementRef: ElementRef,
    private Util: UtilsService,
    private readonly heatmapService: HeatmapService
  ) {}

  defaultContainer() {
    this.maxWidth = 0;
    this.leftMaxWidth = 210;
    this.headerMaxWidth = this.isYAxis ? 210 : 300;
    this.updatelabelbarHeight = 40;
    this.updateLeftlabelbarHeight = 40;
    this.totalWidth = this.leftMaxWidth;
  }
  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.heatmapData) {
      this.isYAxis = this.heatmapData.orientation === 'y';
      if (this.isInverted) {
        this.invertScaleColorMap();
      }
      this.defaultContainer();
      let svg = document.getElementById(`#${this.id}svg`);
      if (svg) {
        svg.remove();
      }
      this.ddd.svg = null;
      this.id = this.elementRef.nativeElement.getAttribute('id');
      this.getMaxWidth();
      this.updateLocalData();
      this.createSvgTag();
      this.drawHeatMap();
      this.drawleftLable();
    }
  }

  invertScaleColorMap() {
    this.colors.forEach((colorMap, scaleId) => {
      // loop through color map for each rating scale id
      const invertedColors = new Map<number, string>();
      colorMap.forEach((color, index) => {
        if (index === 0) {
          // 0th index should be same in both for unrated color
          invertedColors.set(index, color);
        } else {
          invertedColors.set(colorMap.size - index, color);
        }
      });
      this.colors.set(scaleId, new Map([...invertedColors].sort()));
    });
  }

  getMaxWidth() {
    let xz = document.getElementById(this.id);
    var div = document.createElement('div');
    div.setAttribute('id', '1213');
    div.style.width = 'max-content';
    div.style.color = 'white';
    xz.append(div);
    const leftWidthLimit = 830;
    let leftLabels = this.heatmapData.data.map((val) =>
      this.isYAxis ? val.entity_name : val.key
    );
    leftLabels.forEach((val) => {
      div.innerHTML = val;
      var test = document.getElementById('1213');
      let local = test.clientWidth + 50;
      if (local > this.leftMaxWidth) {
        this.leftMaxWidth = local <= leftWidthLimit ? local : leftWidthLimit;
      }
    });

    let headLabels = this.heatmapData.data.map((val: any) =>
      this.isYAxis ? val.key : val.entity_name
    );

    const labelHeightLimit = 100;
    headLabels.forEach((val) => {
      div.innerHTML = val;
      var test = document.getElementById('1213');
      let local = test.clientWidth + test.clientWidth / 2;
      if (local > this.headerMaxWidth) {
        this.headerMaxWidth = local;
        const dynamicWidth = 340;
        if (local > dynamicWidth) {
          this.headerMaxWidth = dynamicWidth;
        }
        let words = val.split(/\s+/).reverse();
        let word;
        let line = [];
        let localHeight = 0;
        const dynamicClientWidth = this.isYAxis ? 100 : 200;
        while ((word = words.pop())) {
          line.push(word);
          div.innerHTML = line.join(' ');
          if (test.clientWidth > dynamicClientWidth) {
            line = [word];
            localHeight = localHeight + 20;
            if (localHeight > this.updatelabelbarHeight) {
              this.updatelabelbarHeight =
                localHeight <= labelHeightLimit
                  ? localHeight
                  : labelHeightLimit;
            } else if (
              localHeight === 40 &&
              this.updatelabelbarHeight <= localHeight
            ) {
              this.updatelabelbarHeight = localHeight + 20;
            }
          }
        }
      }
    });

    let localEntityName = this.heatmapData.data[0].entity_name;
    let leftlabelCount = 0;
    let headlabelCount = 0;
    this.heatmapData.data.map(
      (val) => localEntityName === val.entity_name && leftlabelCount++
    );

    let loheadLabels = [
      ...new Map(
        this.heatmapData.data.map((val) => [val.entity_name, val])
      ).values(),
    ];
    headlabelCount = loheadLabels.length;

    this.totalWidth =
      this.leftMaxWidth +
      (this.isYAxis ? leftlabelCount + 1 : headlabelCount) *
        this.headerMaxWidth;
    div.remove();
  }

  updateLocalData() {
    this.d3Data = this.heatmapData.data.map((value, i) => {
      return {
        chart: {
          y: this.isYAxis ? value.column : value.value,
          x: this.isYAxis ? value.value : value.column,
          value: value.value,
          scoreValue: value.scoreValue,
          height: this.barHeight(),
          label: value.chartText,
          fill: undefined,
          colorVal: value.colorVal,
          rating_scale_id: value.rating_scale_id,
          rating_scale_name: value.rating_scale_name,
        },
      };
    });
  }

  createSvgTag() {
    d3.select(`#${this.id}`)
      .append('svg')
      .attr('width', this.totalWidth)
      .attr('id', `#${this.id}svg`)
      .attr(
        'height',
        this.chartHeight() + CANVAS.margin.top + CANVAS.margin.bottom
      );
    this.ddd.svg = d3.select(`#${this.id} svg`);
  }

  barHeight() {
    return 40;
  }

  chartHeight() {
    if (this.isYAxis) {
      const arrUniq = [
        ...new Map(this.heatmapData.data.map((v) => [v.column, v])).values(),
      ];
      return (
        (arrUniq.length - 1) * this.barHeight() + this.updatelabelbarHeight
      );
    }
    const arrUniq = [
      ...new Map(this.heatmapData.data.map((v) => [v.value, v])).values(),
    ];
    return (arrUniq.length + 1) * this.barHeight() + this.updatelabelbarHeight;
  }

  chartWidth() {
    return this.totalWidth - this.leftMaxWidth;
  }

  drawHeatMap() {
    const arrUniq = [
      ...new Map(this.heatmapData.data.map((v) => [v.entity_name, v])).values(),
    ];
    let data = arrUniq.map((value) => ({
      chart: {
        x: this.isYAxis ? 0 : value.column,
        y: this.isYAxis ? value.column : 0,
        value: value.value,
        height: this.isYAxis ? this.barHeight() : this.updatelabelbarHeight,
        label: value.entity_name.split('**')[0],
        fill: 'rgb(18, 107, 130)',
        colorVal: value.colorVal,
        rating_scale_id: value.rating_scale_id,
        rating_scale_name: value.rating_scale_name,
      },
    }));

    this.d3Data = [...this.d3Data, ...data];
    this.heatmapService.setChartData(this.d3Data);
    let xArray: number[] = this.d3Data.map((a) => a.chart.x);
    this.axis.x.values = d3
      .scaleLinear()
      .domain(d3.extent(xArray))
      .range([this.leftMaxWidth, this.chartWidth()]);

    // this.axis.x.scale becomes a function that converts a x value to a x position
    this.axis.x.scale = d3
      .scaleBand()
      .domain([...new Set(xArray)] as unknown as readonly string[])
      .paddingInner(0)
      .paddingOuter(0)
      .range([this.leftMaxWidth, this.totalWidth]);

    let yArray: number[] = this.d3Data.map((a) => a.chart.y);
    this.axis.y.values = d3
      .scaleLinear()
      .domain(d3.extent(yArray))
      .range([this.barHeight(), this.chartHeight()]);

    const yRange = this.isYAxis
      ? [
          this.updatelabelbarHeight,
          arrUniq.length * this.barHeight() -
            this.barHeight() +
            this.updatelabelbarHeight,
        ]
      : [
          this.updatelabelbarHeight - this.barHeight(),
          this.heatmapData.data.filter(
            (val) => val.entity_name === arrUniq[0].entity_name
          ).length *
            this.barHeight() -
            this.barHeight() +
            this.updatelabelbarHeight,
        ];
    this.axis.y.scale = d3
      .scaleLinear()
      .domain(d3.extent(yArray))
      .range(yRange);

    let result = this.ddd.svg
      .append('g')
      .attr('transform', `translate(${0}, ${0})`);
    result
      .selectAll('rect')
      .data(this.d3Data)
      .enter()
      .append('rect')
      .attr('fill', (d) =>
        d.chart?.fill
          ? d.chart.fill
          : d.chart.scoreValue
          ? this.heatmapService.getColorFill(d, this.d3ColorScales)
          : this.colors.get(d.chart.rating_scale_id).get(0)
      )
      .attr('stroke', 'rgb(188, 188, 188)')
      .attr('stroke-width', ' 1px')
      .attr('height', (d) => d.chart.height)
      .attr('width', (d) =>
        d.chart.x === 0 ? this.leftMaxWidth : this.axis.x.scale.bandwidth()
      )
      .attr('x', (d) => (d.chart.x === 0 ? 0 : this.axis.x.scale(d.chart.x)))
      .attr('y', (d) => (d.chart.y === 0 ? 0 : this.axis.y.scale(d.chart.y)));
    result
      .selectAll('text')
      .data(this.d3Data)
      .enter()
      .append('text')
      .text((d) => d.chart.label)
      .call(
        this.wrap,
        300,
        this.axis.x.scale,
        this.leftMaxWidth,
        this.isYAxis,
        false
      )
      .attr('x', (d) =>
        d.chart.x === 0
          ? 0 + this.leftMaxWidth / 2
          : this.axis.x.scale(d.chart.x) + this.axis.x.scale.bandwidth() / 2
      )
      .attr('y', (d) =>
        d.chart.y === 0
          ? this.barHeight() / 2
          : this.axis.y.scale(d.chart.y) + this.barHeight() / 2
      )
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .style('fill', (d) =>
        this.Util.isColorLightOrDark(
          d.chart?.fill
            ? d.chart.fill
            : d.chart.scoreValue
            ? this.heatmapService.getColorFill(d, this.d3ColorScales)
            : this.colors.get(d.chart.rating_scale_id).get(0)
        ) === 'dark'
          ? '#fff'
          : '#333'
      );
  }

  drawleftLable() {
    const arrUniq = [
      ...new Map(this.heatmapData.data.map((v) => [v.value, v])).values(),
    ];
    let data: any = [
      {
        label: '',
        value: 0,
        width: this.leftMaxWidth,
        fill: this.isYAxis ? 'rgb(238, 238, 238)' : 'rgb(18, 107, 130)',
        fontWeight: '',
        fontStyle: '',
        y: 0,
        x: 0,
        height: this.updatelabelbarHeight,
      },
    ];
    for (let i = 0; i < arrUniq.length; i++) {
      data.push({
        label: this.heatmapData.data[i].key.trim(),
        value: this.heatmapData.data[i].value,
        x: this.isYAxis
          ? this.heatmapData.data[i].value
          : (this.heatmapData.data[i].key as any),
        y: this.isYAxis ? this.barHeight() : this.heatmapData.data[i].value,
        width: this.isYAxis ? this.headerMaxWidth : this.leftMaxWidth,
        fill: this.heatmapData.data[i].isCategory
          ? 'rgb(238, 238, 238)'
          : 'rgb(255, 255, 255)',
        fontWeight: this.heatmapData.data[i].isCategory ? 'bold' : 'normal',
        fontStyle:
          this.heatmapData.data[i].category_level === 3 ? 'italic' : 'normal',
      });
    }

    let Xdata = data.map((val) => val.x);
    let Ydata = data.map((val) => val.y);
    const xRange = this.isYAxis
      ? [0, this.totalWidth - this.leftMaxWidth]
      : [0, this.leftMaxWidth];
    let XScales = d3
      .scaleBand()
      .domain([...new Set(Xdata)] as any)
      .paddingInner(0)
      .paddingOuter(0)
      .range(xRange as any);
    let YScales = d3
      .scaleLinear()
      .domain(d3.extent(Ydata) as any)
      // .range([0, this.chartHeight() - this.barHeight()]);
      .range([
        this.updatelabelbarHeight - this.barHeight(),
        (Ydata.length - 1) * this.barHeight() -
          this.barHeight() +
          this.updatelabelbarHeight,
      ]);

    let result = this.ddd.svg
      .append('g')
      .attr('transform', `translate(${0}, ${0})`);
    result
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('height', (d) =>
        d.value === 0
          ? this.updatelabelbarHeight
          : this.isYAxis
          ? this.updatelabelbarHeight
          : this.barHeight()
      )
      .attr('stroke', 'rgb(188, 188, 188)')
      .attr('stroke-width', ' 1px')
      .attr('fill', (d) => d.fill)
      .attr('width', (d, i) =>
        this.isYAxis
          ? i === 0
            ? this.leftMaxWidth
            : XScales.bandwidth()
          : d.width
      )
      .attr('x', (d, i) =>
        !this.isYAxis
          ? 0
          : i === 0
          ? 0
          : XScales(data[i - 1].x as any) + this.leftMaxWidth
      )
      .attr('y', (d, i) => (this.isYAxis ? 0 : d.y === 0 ? 0 : YScales(d.y)));
    result
      .selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .text((d) => d.label)
      .call(
        this.wrap,
        300,
        this.axis.x.scale,
        this.leftMaxWidth,
        this.isYAxis,
        true
      )
      .attr('x', (d, i) =>
        !this.isYAxis
          ? this.leftMaxWidth / 2
          : i === 0
          ? 0
          : XScales(data[i - 1].x as any) +
            this.leftMaxWidth +
            XScales.bandwidth() / 2
      )
      .attr('y', (d, i) =>
        this.isYAxis
          ? this.barHeight() / 2
          : YScales(d.y) + this.barHeight() / 2
      )
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-style', (d) => d.fontStyle)
      .style('font-weight', (d) => d.fontWeight);
  }

  wrap(text, width, scale, leftMaxWidth, isYAxis, isheader) {
    if (
      (isYAxis !== undefined && !isYAxis && !isheader) ||
      (isYAxis !== undefined && isYAxis && isheader)
    ) {
      text.each(function () {
        let text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          chartData: any = isheader ? text.data()[0] : text.data()[0]['chart'],
          line = [],
          lineHeight = 20,
          y = text.attr('y'),
          dy = 0,
          tspan = text
            .text(null)
            .append('tspan')
            .attr('x', () =>
              chartData.x === 0
                ? 0 + leftMaxWidth / 2
                : scale(chartData.x) + scale.bandwidth() / 2
            )
            .attr('y', y)
            .attr('dy', dy + 'px');
        while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(' '));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = text
              .append('tspan')
              .attr('x', () =>
                chartData.x === 0
                  ? 0 + leftMaxWidth / 2
                  : scale(chartData.x) + scale.bandwidth() / 2
              )
              .attr('y', y)
              .attr('dy', lineHeight + 'px')
              .text(word);
          }
        }
      });
    }
  }
}
