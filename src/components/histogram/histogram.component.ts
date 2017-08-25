import { Component, OnInit, Input, Output, ViewEncapsulation, ViewContainerRef, ElementRef, HostListener } from '@angular/core';

import {
  ChartType, DataType, MarginModel, DateUnit, HistogramData, SelectedOutputValues, SelectedInputValues,
  ChartDimensions, ChartAxes
} from './histogram.utils';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as d3 from 'd3';

@Component({
  selector: 'arlas-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HistogramComponent implements OnInit {

  public margin: MarginModel = { top: 2, right: 20, bottom: 20, left: 60 };
  public startValue: string = null;
  public endValue: string = null;
  public showTooltip = false;
  public showTitle = true;
  public tooltipHorizontalPosition = '0';
  public tooltipVerticalPosition = '0';
  public tooltipXContent: string;
  public tooltipYContent: string;

  @Input() public xTicks = 5;
  @Input() public yTicks = 5;
  @Input() public chartType: ChartType = ChartType.area;
  @Input() public chartTitle = '';
  @Input() public chartWidth: number = null;
  @Input() public chartHeight: number = null;
  @Input() public dataType: DataType = DataType.numeric;
  @Input() public customizedCssClass = '';
  @Input() public dataUnit = '';
  @Input() public data: Subject<Array<{ key: number, value: number }>> = new Subject<Array<{ key: number, value: number }>>();
  @Input() public dateUnit: DateUnit = DateUnit.millisecond;
  @Input() public ticksDateFormat: string = null;
  @Input() public valuesDateFormat: string = null;
  @Input() public xLabels = 5;
  @Input() public yLabels = 5;
  @Input() public barWeight = 0.6;
  @Input() public isSmoothedCurve = true;
  @Input() public intervalSelection: Subject<SelectedInputValues> = new Subject<SelectedInputValues>();
  @Input() public showXLabels = true;
  @Input() public showXTicks = true;
  @Input() public showYLabels = true;
  @Input() public showYTicks = true;


  @Output() public valuesChangedEvent: Subject<SelectedOutputValues> = new Subject<SelectedOutputValues>();

  private histogramNode: any;
  private histogramElement: ElementRef;
  private histogramTitle: string;
  private context: any;
  private barsContext: any;
  private selectionInterval: SelectedOutputValues = { startvalue: null, endvalue: null };
  private selectionBrush: d3.BrushBehavior<any>;
  private chartAxes: ChartAxes;
  private inputData: Array<{ key: number, value: number }>;
  private chartDimensions: ChartDimensions;
  private hasSelectionExceededData = false;
  private fromSetInterval = false;
  private dataInterval: number;
  private xTicksAxis;
  private xLabelsAxis;
  private yTicksAxis;
  private yLabelsAxis;
  private isWidthFixed = false;
  private isHeightFixed = false;
  private plottingCount = 0;

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {
    Observable.fromEvent(window, 'resize')
        .debounceTime(500)
        .subscribe((event: Event) => {
          this.resizeHistogram(event);
        });
  }

  public ngOnInit() {
    this.histogramNode = this.viewContainerRef.element.nativeElement;
    this.data.subscribe(value => {
      this.plotHistogram(value);
    });
    this.intervalSelection.subscribe(value => {
      this.fromSetInterval = true;
      this.setSelectedInterval(value);
      this.fromSetInterval = false;
    });
  }

  public plotHistogram(inputData: Array<{ key: number, value: number }>): void {
    this.inputData = inputData;
    // set chartWidth value equal to container width when it is not specified by the user
    if (this.chartWidth === null) {
      this.chartWidth = this.el.nativeElement.childNodes[0].offsetWidth;
    } else if (this.chartWidth !== null && this.plottingCount === 0) {
      this.isWidthFixed = true;
    }

    // set chartHeight value equal to container height when it is not specified by the user
    if (this.chartHeight === null) {
      this.chartHeight = this.el.nativeElement.childNodes[0].offsetHeight;
    } else if (this.chartWidth !== null && this.plottingCount === 0) {
      this.isHeightFixed = true;
    }

    // if there is data already ploted, remove it
    if (this.context) {
      this.context.remove();
    }

    if (this.barsContext) {
      this.barsContext.remove();
    }

    let data: Array<HistogramData>;
    if (inputData !== null && Array.isArray(inputData) && inputData.length > 0) {
      data = this.parseDataKey(inputData);

      if (this.startValue == null) {
        this.startValue = this.toString(data[0].key);
        this.selectionInterval.startvalue = data[0].key;
      }
      if (this.endValue == null) {
        this.endValue = this.toString(data[data.length - 1].key);
        this.selectionInterval.endvalue = data[data.length - 1].key;
      }
      this.chartDimensions = this.initializeChartDimensions();
      this.chartAxes = this.createChartAxes(this.chartDimensions, data);
      this.drawChartAxes(this.chartDimensions, this.chartAxes);
      this.plotHistogramData(this.chartDimensions, this.chartAxes, data);
      if (this.chartType === ChartType.area) {
        this.showTooltipsForAreaCharts(this.chartDimensions, this.chartAxes, data);
      }
      this.selectionBrush = d3.brushX().extent([[this.chartAxes.stepWidth, 0],
      [(this.chartDimensions).width, (this.chartDimensions).height]]);
      const selectionBrushStart = Math.max(0, this.chartAxes.xDomain(this.selectionInterval.startvalue));
      const selectionBrushEnd = Math.min(this.chartAxes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
      this.context.append('g')
        .attr('class', 'brush')
        .call(this.selectionBrush).call((this.selectionBrush).move, [selectionBrushStart, selectionBrushEnd]);
      if (this.chartType === ChartType.bars) {
        this.applyStyleOnSelectedBars();
      }
      this.handleOnBrushingEvent(this.selectionBrush, this.chartAxes);
      this.handleEndOfBrushingEvent(this.selectionBrush, this.chartAxes);

    } else {
      this.startValue = '';
      this.endValue = '';
    }

    this.plottingCount++;
  }

  public resizeHistogram(e: Event): void {
    if (this.isWidthFixed === false) {
      this.chartWidth = this.el.nativeElement.childNodes[0].offsetWidth;
    }

    if (this.isHeightFixed === false) {
      this.chartHeight = this.el.nativeElement.childNodes[0].offsetHeight;
    }
    this.plotHistogram(this.inputData);
  }

  private setSelectedInterval(selectedInputValues: SelectedInputValues): void {
    this.checkSelectedValuesValidity(selectedInputValues);
    this.fromSetInterval = true;
    const parsedSelectedValues = this.parseSelectedValues(selectedInputValues);
    if (parsedSelectedValues.startvalue !== this.selectionInterval.startvalue ||
      parsedSelectedValues.endvalue !== this.selectionInterval.endvalue) {
      this.selectionInterval.startvalue = parsedSelectedValues.startvalue;
      this.selectionInterval.endvalue = parsedSelectedValues.endvalue;
      this.startValue = this.toString(this.selectionInterval.startvalue);
      this.endValue = this.toString(this.selectionInterval.endvalue);
      if (this.inputData !== null) {
        if (this.isSelectionBeyondDataDomain(selectedInputValues, this.inputData)) {
          this.plotHistogram(this.inputData);
          this.hasSelectionExceededData = true;
        } else {
          if (this.hasSelectionExceededData) {
            this.plotHistogram(this.inputData);
            this.hasSelectionExceededData = false;
          }
          const selectionBrushStart = Math.max(0, this.chartAxes.xDomain(this.selectionInterval.startvalue));
          const selectionBrushEnd = Math.min(this.chartAxes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
          if (this.context) {
            this.context.select('.brush').call(this.selectionBrush.move, [selectionBrushStart, selectionBrushEnd]);
          }
        }
      }
    }
  }

  private isSelectionBeyondDataDomain(selectedInputValues: SelectedInputValues, inputData: Array<{ key: number, value: number }>): boolean {
    if (selectedInputValues.startvalue < inputData[0].key || selectedInputValues.endvalue > inputData[inputData.length - 1].key) {
      return true;
    } else {
      return false;
    }
  }

  private checkSelectedValuesValidity(selectedInputValues: SelectedInputValues) {
    if (selectedInputValues.startvalue > selectedInputValues.endvalue) {
      throw new Error('Start value is higher than end value');
    }
    if (selectedInputValues.startvalue === null && selectedInputValues.endvalue === null) {
      throw new Error('Start and end values are null');
    }
  }

  private initializeChartDimensions(): ChartDimensions {
    const svg = d3.select(this.histogramNode).select('svg');

    const margin = this.margin;
    const width = +this.chartWidth - this.margin.left - this.margin.right;
    const height = +this.chartHeight - this.margin.top - this.margin.bottom;
    return { svg, margin, width, height };
  }

  // retruns d3.ScaleTime<number,number> or d3.ScaleLinear<number,number>
  private getXDomainScale(): any {
    if (this.dataType === DataType.time) {
      return d3.scaleTime();
    } else {
      return d3.scaleLinear();
    }
  }

  private createChartAxes(chartDimensions: ChartDimensions, data: Array<HistogramData>): ChartAxes {
    const xDomain = (this.getXDomainScale()).range([0, chartDimensions.width]);
    // The xDomain extent includes data domain and selected values
    const xDomainExtent = this.getXDomainExtent(data, this.selectionInterval.startvalue, this.selectionInterval.endvalue);
    xDomain.domain(xDomainExtent);
    // xDataDomain includes data domain only
    let xDataDomain;
    let xTicksAxis;
    let xLabelsAxis;
    let stepWidth;
    // Compute the range (in pixels) of xDataDomain where data will be plotted
    const startRange = xDomain(data[0].key);
    let endRange;
    const ticksPeriod = Math.max(1, Math.round(data.length / this.xTicks));
    const labelsPeriod = Math.max(1, Math.round(data.length / this.xLabels));
    if (this.chartType === ChartType.area) {
      stepWidth = 0;
      endRange = xDomain(+data[data.length - 1].key);
      xDataDomain = (this.getXDomainScale()).range([startRange, endRange]);
      xDataDomain.domain(d3.extent(data, (d: any) => d.key));
      xTicksAxis = d3.axisBottom(xDomain).ticks(this.xTicks);
      xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(10).ticks(this.xLabels);
      if (this.dataType === DataType.time && this.ticksDateFormat !== null) {
        xLabelsAxis = xLabelsAxis.tickFormat(d3.timeFormat(this.ticksDateFormat));
      }
    } else {
      if (data.length > 1) {
        stepWidth = xDomain(data[1].key) - xDomain(data[0].key);
      } else {
        stepWidth = xDomain(data[0].key);
      }
      endRange = xDomain(+data[data.length - 1].key + this.dataInterval) ;
      xDataDomain = d3.scaleBand().range([startRange, endRange]).paddingInner(0);
      xDataDomain.domain(data.map(function(d) { return d.key; }));
      xTicksAxis = d3.axisBottom(xDomain).tickPadding(5).tickValues(xDataDomain.domain()
        .filter(function (d, i) { return !(i % ticksPeriod); }));
      xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(7).tickValues(xDataDomain.domain()
        .filter(function (d, i) { return !(i % labelsPeriod); }));
    }
    const yDomain = d3.scaleLinear().range([chartDimensions.height, 0]);
    yDomain.domain([0, d3.max(data, (d: any) => d.value)]);
    const yTicksAxis = d3.axisLeft(yDomain).ticks(this.yTicks);
    const yLabelsAxis = d3.axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.yLabels);
    return { xDomain, xDataDomain, yDomain, xTicksAxis, yTicksAxis, stepWidth, xLabelsAxis, yLabelsAxis };
  }

  private drawChartAxes(chartDimensions: ChartDimensions, chartAxes: ChartAxes): void {
    // draw two axes for each X and Y
    // For the first ones, labels are always hidden. The axe and ticks are shown.
    // The second ones the axe and ticks are always hidden. Only labels are shown.
    this.context = chartDimensions.svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + chartDimensions.margin.top + ')');
    this.xTicksAxis = this.context.append('g')
      .attr('class', 'histogram__ticks-axis')
      .attr('transform', 'translate(0,' + chartDimensions.height + ')')
      .call(chartAxes.xTicksAxis);
    this.xLabelsAxis = this.context.append('g')
      .attr('class', 'histogram__labels-axis')
      .attr('transform', 'translate(0,' + chartDimensions.height + ')')
      .call(chartAxes.xLabelsAxis);
    this.yTicksAxis = this.context.append('g')
      .attr('class', 'histogram__ticks-axis')
      .call(chartAxes.yTicksAxis);
    this.yLabelsAxis = this.context.append('g')
      .attr('class', 'histogram__labels-axis')
      .call(chartAxes.yLabelsAxis);

    // Define css classes for the ticks, labels and the axes
    this.xTicksAxis.selectAll('path').attr('class', 'histogram__axis');
    this.yTicksAxis.selectAll('path').attr('class', 'histogram__axis');
    this.xTicksAxis.selectAll('line').attr('class', 'histogram__ticks');
    this.yTicksAxis.selectAll('line').attr('class', 'histogram__ticks');
    this.xLabelsAxis.selectAll('text').attr('class', 'histogram__labels');
    this.yLabelsAxis.selectAll('text').attr('class', 'histogram__labels');

    if (!this.showXTicks) {
      this.xTicksAxis.selectAll('g').attr('class', 'histogram__ticks-axis__hidden');
    }
    if (!this.showXLabels) {
      this.xLabelsAxis.attr('class', 'histogram__labels-axis__hidden');
    }

    if (!this.showYTicks) {
      this.yTicksAxis.selectAll('g').attr('class', 'histogram__ticks-axis__hidden');
    }
    if (!this.showYLabels) {
      this.yLabelsAxis.attr('class', 'histogram__labels-axis__hidden');
    }
  }

  private plotHistogramData(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    if (this.chartType === ChartType.bars) {
      this.plotHistogramDataAsBars(chartDimensions, chartAxes, data);
    } else if (this.chartType === ChartType.area) {
      this.plotHistogramDataAsArea(chartDimensions, chartAxes, data);
    }
  }

  private plotHistogramDataAsBars(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const _thisComponent = this;
    this.barsContext = chartDimensions.svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'histogram__chart--bar')
      .attr('x', function (d) { return chartAxes.xDataDomain(d.key); })
      .attr('width', chartAxes.stepWidth * _thisComponent.barWeight)
      .attr('y', function (d) { return chartAxes.yDomain(d.value); })
      .attr('height', function (d) { return chartDimensions.height - chartAxes.yDomain(d.value); })
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + chartDimensions.margin.top + ')')
      .on('mousemove', function (d) {
        _thisComponent.setTooltipPosition(-40, -40, d);
      })
      .on('mouseout', function (d) { _thisComponent.showTooltip = false; });
  }

  private plotHistogramDataAsArea(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    let curveType: d3.CurveFactory;
    if (this.isSmoothedCurve) {
      curveType = d3.curveMonotoneX;
    } else {
      curveType = d3.curveLinear;
    }
    const area = d3.area()
      .curve(curveType)
      .x((d: any) => chartAxes.xDataDomain(d.key))
      .y0(chartDimensions.height)
      .y1((d: any) => chartAxes.yDomain(d.value));
    this.context.append('path')
      .datum(data)
      .attr('class', 'histogram__chart--area')
      .attr('d', area);
  }

  private showTooltipsForAreaCharts(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const _thisComponent = this;
    if (this.dataUnit !== '') {
      this.dataUnit = '(' + this.dataUnit + ')';
    }
    chartDimensions.svg.selectAll('dot').data(data).enter().append('circle')
      .attr('r', 10)
      .attr('cx', function (d) { return chartDimensions.margin.left + chartAxes.xDomain(d.key); })
      .attr('cy', function (d) { return chartDimensions.margin.top + chartAxes.yDomain(d.value); })
      .attr('class', 'histogram__tooltip__circle')
      .on('mouseover', function (d) {
        _thisComponent.setTooltipPosition(-40, -40, d);
      })
      .on('mouseout', function (d) {
        _thisComponent.showTooltip = false;
      });
  }

  private setTooltipPosition(dx: number, dy: number, data: HistogramData): void {
    this.showTooltip = true;
    this.tooltipXContent = 'x: ' + this.toString(data.key);
    this.tooltipYContent = 'y: ' + data.value + ' ' + this.dataUnit;
    this.tooltipVerticalPosition = (d3.event.pageX + dx) + 'px';
    this.tooltipHorizontalPosition = (d3.event.pageY + dy) + 'px';

  }

  private handleOnBrushingEvent(selectionbrush: d3.BrushBehavior<any>, chartAxes: ChartAxes): void {
    selectionbrush.on('brush', (datum: any, index: number) => {
      const selection = d3.event.selection;
      this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
      this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
      this.startValue = 'From ' + this.toString(this.selectionInterval.startvalue);
      this.endValue = ' to ' + this.toString(this.selectionInterval.endvalue);
      this.showTitle = false;

      if (this.chartType === ChartType.bars) {
          this.applyStyleOnSelectedBars();
        }
    });
  }

  private handleEndOfBrushingEvent(selectionbrush: d3.BrushBehavior<any>, chartAxes: ChartAxes): void {
    const valueChangedEvent = this.valuesChangedEvent;
    const _thisComponent = this;
    selectionbrush.on('end', (datum: any, index: number) => {
      const selection = d3.event.selection;
      if (selection !== null) {
        this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
        this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
        this.startValue = this.toString(this.selectionInterval.startvalue);
        this.endValue = this.toString(this.selectionInterval.endvalue);
        if (!this.fromSetInterval) {
          valueChangedEvent.next(this.selectionInterval);
        }
        this.showTitle = true;
      }
    });
  }

  private applyStyleOnSelectedBars(): void {
    const _thisComponent = this;
    (this.barsContext).filter(function(d) {
      d.key = +d.key;
      return d.key >= _thisComponent.selectionInterval.startvalue
       && d.key + _thisComponent.barWeight <= _thisComponent.selectionInterval.endvalue;
    })
    .attr('class', 'histogram__chart--bar__fullyselected');

    (this.barsContext).filter(function(d) {
      d.key = +d.key;
      return d.key < _thisComponent.selectionInterval.startvalue || d.key > _thisComponent.selectionInterval.endvalue;
    })
    .attr('class', 'histogram__chart--bar');

    (this.barsContext).filter(function(d) {
      d.key = +d.key;
      return d.key < _thisComponent.selectionInterval.startvalue
      && d.key + _thisComponent.barWeight > _thisComponent.selectionInterval.startvalue;
    })
    .attr('class', 'histogram__chart--bar__partlyselected');


    (this.barsContext).filter(function(d) {
      d.key = +d.key;
      return d.key <= _thisComponent.selectionInterval.endvalue
      && d.key + _thisComponent.barWeight > _thisComponent.selectionInterval.endvalue;
    })
    .attr('class', 'histogram__chart--bar__partlyselected');
  }

  private toString(value: Date|number): string {
    if (value instanceof Date) {
      if (this.valuesDateFormat !== null) {
        const timeFormat = d3.timeFormat(this.valuesDateFormat);
        return timeFormat(value);
      } else {
        return value.toDateString();
      }
    } else {
      return this.round(value, 1).toString();
    }
  }


  private parseDataKey(inputData: Array<{ key: number, value: number }>): Array<HistogramData> {
    if (this.dataType === DataType.time) {
      return this.parseDataKeyToDate(inputData);
    } else {
      return inputData;
    }
  }

  private parseDataKeyToDate(inputData: Array<{ key: number, value: number }>) {
    const parsedData = new Array<HistogramData>();
    let multiplier = 1;
    if (this.dateUnit === DateUnit.second) {
      multiplier = 1000;
    }
    inputData.forEach(d => {
      parsedData.push({ key: new Date(d.key * multiplier), value: d.value });
    });
    return parsedData;
  }

  private parseSelectedValues(selectedValues: SelectedInputValues): SelectedOutputValues {
    const parsedSelectedValues: SelectedOutputValues = { startvalue: null, endvalue: null };
    if (this.dataType === DataType.time) {
      let multiplier = 1;
      if (this.dateUnit === DateUnit.second) {
        multiplier = 1000;
      }
      parsedSelectedValues.startvalue = new Date(selectedValues.startvalue * multiplier);
      parsedSelectedValues.endvalue = new Date(selectedValues.endvalue * multiplier);
      return parsedSelectedValues;
    } else {
      return selectedValues;
    }
  }

  private round(value, precision): number {
    let multiplier;
    if (precision === 1) {
      multiplier = precision;
    } else {
      multiplier = Math.pow(10, precision * 10 || 0);
    }
    return Math.round(value * multiplier) / multiplier;
  }

  private getXDomainExtent(data: Array<HistogramData>, selectedStartValue: Date|number,
  selectedEndValue: Date|number): Array<Date | number | { valueOf(): number }> {
    this.dataInterval = 0;
    if (this.chartType === ChartType.bars) {
      this.dataInterval = this.getBucketInterval(data);
    }
    const xDomainExtent = new Array<Date | number | { valueOf(): number }>();
    const dataKeyUnionSelectedValues = new Array<Date | number>();
    data.forEach(d => {
      dataKeyUnionSelectedValues.push(d.key);
    });
    dataKeyUnionSelectedValues.push(selectedStartValue);
    dataKeyUnionSelectedValues.push(selectedEndValue);
    if ( this.dataType === DataType.time) {
      xDomainExtent.push(new Date(d3.min(dataKeyUnionSelectedValues, (d: Date) => d).getTime() - this.dataInterval));
      xDomainExtent.push(new Date(d3.max(dataKeyUnionSelectedValues, (d: Date) => d).getTime() + this.dataInterval));
    } else {
      xDomainExtent.push(d3.min(dataKeyUnionSelectedValues, (d: number) => d) * 1 - this.dataInterval);
      xDomainExtent.push(d3.max(dataKeyUnionSelectedValues, (d: number) => d) * 1 + this.dataInterval);
    }
    return xDomainExtent;
  }

  private getBucketInterval(data: Array<{ key: any, value: number }>): number {
    let interval = Number.MAX_VALUE;
    if (data.length > 1) {
      for (let i = 0; i < (data.length - 1); i++) {
        if (this.dataType === DataType.time) {
          interval = Math.min(interval, data[i + 1].key.getTime() - data[i].key.getTime());
        } else {
          interval = Math.min(interval, data[i + 1].key - data[i].key);
        }
      }
      if (interval === Number.MAX_VALUE) {
        interval = 0;
      }
    }
    return interval;
  }

}
