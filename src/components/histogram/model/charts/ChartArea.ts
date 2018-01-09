import { AbstractChart } from './AbstractChart';
import * as d3 from 'd3';

import { HistogramData, HistogramUtils, ChartAxes, DataType, SelectedOutputValues } from '../../histogram.utils';


export class ChartArea extends AbstractChart {
  private clipPathContext;
  private rectangleClipper;
  private selectedIntervals = new Map<string, {rect: any, startEndValues: SelectedOutputValues}>();

  public plot(inputData: Array<{ key: number, value: number }>) {
    super.plot(inputData);
  }

  public resize(): void {
    super.resize();
    this.plot(<Array<{ key: number, value: number }>>this.histogramParams.data);
    if (this.histogramParams.multiselectable) {
      this.resizeSelectedIntervals(this.chartAxes);
    }
  }

  protected plotChart(data: Array<HistogramData>): void {
    this.clipPathContext = this.context.append('defs').append('clipPath')
      .attr('id', this.histogramParams.uid);
    this.rectangleClipper = this.getAppendedRectangle(this.selectionInterval.startvalue, this.selectionInterval.endvalue);
    console.log('rectClipper');
    const curveType: d3.CurveFactory = (this.histogramParams.isSmoothedCurve) ? d3.curveMonotoneX : d3.curveLinear;
    const area = d3.area()
      .curve(curveType)
      .x((d: any) => this.chartAxes.xDataDomain(d.key))
      .y0(this.chartDimensions.height)
      .y1((d: any) => this.chartAxes.yDomain(d.value));
      this.context.append('g').attr('class', 'histogram__area-data')
      .append('path')
      .datum(data)
      .attr('class', 'histogram__chart--unselected--area')
      .attr('d', area);
    const url = 'url(#'+this.histogramParams.uid+')';
    this.context.append('g').attr('class', 'histogram__area-data').attr('clip-path', url)
      .append('path')
      .datum(data)
      .attr('class', 'histogram__chart--selected--area')
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

  protected onSelectionDoubleClick(axes: ChartAxes) {
    this.brushContext.on('dblclick', () => {
      console.log('dblclick');

      if (this.isBrushed) {
        const finalPosition = this.getIntervalMiddlePositon(axes, +this.selectionInterval.startvalue, +this.selectionInterval.endvalue);
        let guid;
        if ((typeof (<Date>this.selectionInterval.startvalue).getMonth === 'function')) {
          const startMilliString = (<Date>this.selectionInterval.startvalue).getTime().toString();
          const start = startMilliString.substring(0, startMilliString.length - 3);
          const endMilliString = (<Date>this.selectionInterval.endvalue).getTime().toString();
          const end = endMilliString.substring(0, endMilliString.length - 3);
          guid = start + '000' + end + '000';
        } else {
          guid = this.selectionInterval.startvalue.toString() + this.selectionInterval.endvalue.toString();
        }
        this.histogramParams.intervalSelectedMap.set(guid,
          {
            values: { startvalue: this.selectionInterval.startvalue, endvalue: this.selectionInterval.endvalue },
            x_position: finalPosition
          });
        if (this.histogramParams.selectionListIntervalId.indexOf(guid) < 0) {
          this.histogramParams.selectionListIntervalId.push(guid);
        }

        if (!this.selectedIntervals.has(guid)) {
          const rect = this.getAppendedRectangle(this.selectionInterval.startvalue, this.selectionInterval.endvalue);
          this.selectedIntervals.set(guid, {rect: rect, startEndValues: {startvalue : this.selectionInterval.startvalue, endvalue: this.selectionInterval.endvalue}});
        }
      } else {
        if (this.rectangleClipper !== null) {
          this.rectangleClipper.remove();
          this.rectangleClipper = null;
        }
      }
    });

    this.brushContext.on('click', () => {
      if (!this.isBrushed && this.rectangleClipper !== null) {
        this.rectangleClipper.remove();
        this.rectangleClipper = null;
      }
    });
  }

  protected getIntervalMiddlePositon(chartAxes: ChartAxes, startvalue: number, endvalue: number): number {
    return this.histogramParams.margin.left + chartAxes.xDomain(startvalue) +
      1/2 * (chartAxes.xDomain(endvalue) - chartAxes.xDomain(startvalue)) - 24 / 2;
  }

  public redrawSelectedIntervals(): void {
    super.redrawSelectedIntervals();
    this.selectedIntervals.forEach((rectClipper, guid) => { rectClipper.rect.remove(); });
    this.selectedIntervals.clear();
    this.histogramParams.intervalListSelection.forEach((v) => {
      if (this.histogramParams.dataType === DataType.time) {
        v.startvalue = new Date(+v.startvalue);
        v.endvalue = new Date(+v.endvalue);
      }
      const guid = HistogramUtils.getIntervalGUID(v.startvalue, v.endvalue);
      const rect = this.getAppendedRectangle(v.startvalue, v.endvalue);
      this.selectedIntervals.set(guid, {rect: rect, startEndValues: {startvalue : v.startvalue, endvalue: v.endvalue}});
    });
  }

  protected updateSelectionStyle(id: string): void {}

  public removeSelectInterval(id: string) {
    super.removeSelectInterval(id);
    this.selectedIntervals.get(id).rect.remove();
    this.selectedIntervals.delete(id);
  }

  protected addSelectionBrush(chartAxes: ChartAxes, leftOffset: number): void {
    super.addSelectionBrush(chartAxes, leftOffset);
    this.applyStyleOnSelection();
    if (this.histogramParams.multiselectable) {
      this.onSelectionDoubleClick(chartAxes);
    }
  }

  protected applyStyleOnSelection() {
    if (this.rectangleClipper === null) {
      this.rectangleClipper = this.getAppendedRectangle(this.selectionInterval.startvalue, this.selectionInterval.endvalue);
    } else {
      this.rectangleClipper
        .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
        .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue));
    }
  }

  protected resizeSelectedIntervals(chartAxes: ChartAxes) {
    super.resizeSelectedIntervals(chartAxes);
    this.selectedIntervals.forEach((rect, guid) => {
      rect.rect.remove();
      const rectangle = this.getAppendedRectangle(rect.startEndValues.startvalue, rect.startEndValues.endvalue);
      this.selectedIntervals.set(guid, {rect: rectangle, startEndValues: rect.startEndValues});
    });
  }

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

  private getAppendedRectangle (start: Date | number, end: Date | number): any {
    return this.clipPathContext.append('rect')
    .attr('id', 'clip-rect')
    .attr('x', this.chartAxes.xDomain(start))
    .attr('y', '0')
    .attr('width', this.chartAxes.xDomain(end) - this.chartAxes.xDomain(start))
    .attr('height', this.chartDimensions.height );
  }

}
