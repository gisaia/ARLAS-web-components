import { AbstractChart } from './AbstractChart';
import * as d3 from 'd3';

import { HistogramData, HistogramUtils, ChartAxes, DataType } from '../../histogram.utils';


export class ChartArea extends AbstractChart {

  public plot(inputData: Array<{ key: number, value: number }>) {
    super.plot(inputData);
  }

  public resize(): void {
    super.resize();
    this.plot(<Array<{ key: number, value: number }>>this.histogramParams.data);
  }

  protected plotChart(data: Array<HistogramData>): void {
    const curveType: d3.CurveFactory = (this.histogramParams.isSmoothedCurve) ? d3.curveMonotoneX : d3.curveLinear;
    const area = d3.area()
      .curve(curveType)
      .x((d: any) => this.chartAxes.xDataDomain(d.key))
      .y0(this.chartDimensions.height)
      .y1((d: any) => this.chartAxes.yDomain(d.value));
    this.context.append('g').attr('class', 'histogram__area-data')
      .append('path')
      .datum(data)
      .attr('class', 'histogram__chart--area')
      .attr('d', area);
  }

  protected createChartAxes(data: Array<HistogramData>): void {
    super.createChartAxes(data);
    this.chartAxes.stepWidth = 0;
    const startRange = this.chartAxes.xDomain(data[0].key);
    const endRange = this.chartAxes.xDomain(+data[data.length - 1].key);
    const xDataDomain = (this.getXDomainScale()).range([startRange, endRange]);
    xDataDomain.domain(d3.extent(data, (d: any) => d.key));
    this.chartAxes.xDataDomain = xDataDomain;
    this.chartAxes.xAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0);
    this.chartAxes.xTicksAxis = d3.axisBottom(this.chartAxes.xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 5);
    this.chartAxes.xLabelsAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0)
      .tickPadding(this.minusSign * 12).ticks(this.histogramParams.xLabels);
    if (this.histogramParams.dataType === DataType.time && this.histogramParams.ticksDateFormat !== null) {
      this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.tickFormat(d3.timeFormat(this.histogramParams.ticksDateFormat));
    }
  }

  protected drawChartAxes(chartAxes: ChartAxes, leftOffset: number): void {
    super.drawChartAxes(chartAxes, leftOffset);
    this.drawYAxis(chartAxes);
  }

  protected applyStyleOnSelection() {}

  protected getStartPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key) - 10;
  }

  protected getEndPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key) + 10;
  }

  protected setTooltipXposition(xPosition: number): number {
    if (xPosition > this.chartDimensions.width / 2) {
      this.histogramParams.tooltip.isRightSide = true;
      return (this.chartDimensions.width) - 2 * xPosition + 25;
    } else {
      this.histogramParams.tooltip.isRightSide = false;
      if (!this.histogramParams.showYLabels) {
        return 30;
      } else {
        return 80;
      }

    }
  }

  protected getAxes() {
    return this.chartAxes;
  }

  protected setTooltipYposition(yPosition: number): number {
    return -10;
  }

  protected setDataInterval(data: Array<HistogramData>): void {
    this.dataInterval = 0;
  }

}
