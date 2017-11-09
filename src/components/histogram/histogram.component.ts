import {
  Component, OnInit, Input, Output, ViewEncapsulation,
  ViewContainerRef, ElementRef, OnChanges, SimpleChanges
} from '@angular/core';

import {
  ChartType, DataType, MarginModel, DateUnit, HistogramData, SelectedOutputValues,
  ChartDimensions, ChartAxes, Position
} from './histogram.utils';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as d3 from 'd3';
import * as tinycolor from 'tinycolor2';
import { SelectedInputValues } from './histogram.utils';

@Component({
  selector: 'arlas-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HistogramComponent implements OnInit, OnChanges {



  public margin: MarginModel = { top: 4, right: 10, bottom: 20, left: 60 };
  public startValue: string = null;
  public endValue: string = null;
  public showTooltip = false;
  public showTitle = true;
  public tooltipHorizontalPosition = '0';
  public tooltipVerticalPosition = '0';
  public tooltipXContent: string;
  public tooltipYContent: string;

  public inputData: Array<{ key: number, value: number }>;
  public dataLength: number;
  public displaySvg = 'none';
  public brushHandles;
  public brushHandlesHeight: number = null;

  @Input() public xTicks = 5;
  @Input() public yTicks = 5;
  @Input() public chartType: ChartType = ChartType.area;
  @Input() public chartTitle = '';
  @Input() public chartWidth: number = null;
  @Input() public chartHeight: number = null;
  @Input() public dataType: DataType = DataType.numeric;
  @Input() public customizedCssClass = '';
  @Input() public dataUnit = '';
  @Input() public data: Array<{ key: number, value: number }>;
  @Input() public dateUnit: DateUnit = DateUnit.millisecond;
  @Input() public ticksDateFormat: string = null;
  @Input() public valuesDateFormat: string = null;
  @Input() public xLabels = 5;
  @Input() public yLabels = 5;
  @Input() public barWeight = 0.6;
  @Input() public isSmoothedCurve = true;
  @Input() public isHistogramSelectable = true;
  @Input() public intervalSelection: SelectedInputValues;
  @Input() public intervalListSelection: SelectedInputValues[];
  @Input() public multiselectable = false;
  @Input() public showXLabels = true;
  @Input() public showXTicks = true;
  @Input() public showYLabels = true;
  @Input() public showYTicks = true;
  @Input() public descriptionPosition: Position = Position.bottom;
  @Input() public xAxisPosition: Position = Position.bottom;
  @Input() public paletteColors: [number, number] | string = null;
  @Input() public brushHandlesHeightWeight = 1 / 2;


  @Output() public valuesListChangedEvent: Subject<SelectedOutputValues[]> = new Subject<SelectedOutputValues[]>();

  private histogramNode: any;
  private histogramElement: ElementRef;
  private histogramTitle: string;
  private context: any;
  private barsContext: any;
  private selectionInterval: SelectedOutputValues = { startvalue: null, endvalue: null };
  private selectionListInterval: SelectedOutputValues[] = [];
  private selectedBars = new Set();
  private selectionBrush: d3.BrushBehavior<any>;
  private chartAxes: ChartAxes;
  private chartDimensions: ChartDimensions;
  private hasSelectionExceededData = false;
  private fromSetInterval = false;
  private dataInterval: number;
  private xTicksAxis;
  private xLabelsAxis;
  private xAxis;
  private yTicksAxis;
  private yLabelsAxis;
  private isWidthFixed = false;
  private isHeightFixed = false;
  private isbrush = false;
  // Counter of how many times the chart has been plotted/replotted
  private plottingCount = 0;
  private minusSign = 1;
  // yDimension = 0 for one dimension charts
  private yDimension = 1;
  private tooltipxPositionWeight = 40;

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {


    Observable.fromEvent(window, 'resize')
      .debounceTime(500)
      .subscribe((event: Event) => {
        this.resizeHistogram(event);
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.histogramNode = this.viewContainerRef.element.nativeElement;
    if (this.data !== undefined) {
      this.plotHistogram(this.data);
      if (this.intervalSelection !== undefined && this.data.length > 0) {
        this.setSelectedInterval(this.intervalSelection);
      }
      this.fromSetInterval = false;
    }
    // to draw the chart on init with correct width
    if (changes.data) {
      if (changes.data.previousValue !== undefined) {
        if (changes.data.previousValue.length === 0) {
          this.resizeHistogram(null);
        }
      }
    }
    if (changes.intervalListSelection) {
      if (changes.intervalListSelection.currentValue) {
        this.selectedBars.clear();
        changes.intervalListSelection.currentValue.forEach(value => {
          (this.barsContext).filter(d => {
            d.key = +d.key;
            return d.key >= value.startvalue
              && d.key + this.barWeight * this.dataInterval <= value.endvalue;
          }).data().map(d => { this.selectedBars.add(d.key); });
        });
        this.resizeHistogram(null);
      }
    }

  }
  public ngOnInit() {
    this.histogramNode = this.viewContainerRef.element.nativeElement;
    if (this.xAxisPosition === Position.top) {
      this.minusSign = -1;
    }

  }


  public setHistogramMargins() {
    // tighten right and bottom margins when X labels are not shown
    if (!this.showXLabels) {
      this.margin.bottom = 5;
      this.margin.right = 7;
    }

    // tighten left margin when Y labels are not shown
    // for oneDimension, left margin is tightened only if showYLabels = true
    if (!this.showYLabels || (!this.showYLabels && this.chartType === ChartType.oneDimension)) {
      this.tooltipxPositionWeight = -15;
      if (this.showXLabels) {
        this.margin.left = 10;
      } else {
        this.margin.left = 7;
      }
    }

    if (!this.isHistogramSelectable) {
      this.margin.right = 0;
      this.margin.left = 5;
    }

    // set chartWidth value equal to container width when it is not specified by the user
    if (this.chartWidth === null) {
      this.chartWidth = this.el.nativeElement.childNodes[0].offsetWidth;
    } else if (this.chartWidth !== null && this.plottingCount === 0) {
      this.isWidthFixed = true;
    }

    // Set oneDimension chart height to 8px as a default value
    if (this.chartType === ChartType.oneDimension && this.chartHeight === null) {
      this.chartHeight = 8 + this.margin.top + this.margin.bottom;
      this.yDimension = 0;
    }

    // set chartHeight value equal to container height when it is not specified by the user
    if (this.chartHeight === null) {
      this.chartHeight = this.el.nativeElement.childNodes[0].offsetHeight;
    } else if (this.chartHeight !== null && this.plottingCount === 0) {
      this.isHeightFixed = true;
      if (this.chartType === ChartType.oneDimension) {
        this.yDimension = 0;
        this.chartHeight = this.chartHeight + this.margin.top + this.margin.bottom;
      }
    }


  }

  public plotHistogram(inputData: Array<{ key: number, value: number }>): void {
    this.inputData = inputData;

    this.setHistogramMargins();

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
      this.dataLength = data.length;

      if (this.startValue == null || this.startValue === '') {
        this.startValue = this.toString(data[0].key);
        this.selectionInterval.startvalue = data[0].key;
      }
      if (this.endValue == null || this.endValue === '') {
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
      this.selectionBrush = d3.brushX().extent([[this.chartAxes.stepWidth * this.yDimension, 0],
      [(this.chartDimensions).width, (this.chartDimensions).height]]);

      if (this.isHistogramSelectable) {
        this.addSelectionBrush();
      }
    } else {
      this.startValue = '';
      this.endValue = '';
      this.dataLength = 0;
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
    this.applyStyleOnSelectedBars();
  }

  private addSelectionBrush(): void {

    const selectionBrushStart = Math.max(0, this.chartAxes.xDomain(this.selectionInterval.startvalue));
    const selectionBrushEnd = Math.min(this.chartAxes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
    const _thisComponent = this;
    const brush = this.context.append('g')
      .attr('class', 'brush')
      .call(this.selectionBrush);

    this.handleStartOfBrushingEvent();

    const brushResizePath = function (d) {
      const e = +(d.type === 'e'),
        x = e ? 1 : -1,
        y = _thisComponent.brushHandlesHeight;
      return 'M' + (.5 * x) + ',' + y
        + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
        + 'V' + (2 * y - 6) + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
        + 'Z'
        + 'M' + (2.5 * x) + ',' + (y + 8)
        + 'V' + (2 * y - 8)
        + 'M' + (4.5 * x) + ',' + (y + 8)
        + 'V' + (2 * y - 8);
    };

    this.brushHandles = brush.selectAll('.histogram__brush--handles')
      .data([{ type: 'w' }, { type: 'e' }])
      .enter().append('path')
      .attr('class', 'histogram__brush--handles')
      .attr('stroke', '#000')
      .attr('cursor', 'ew-resize')
      .attr('d', brushResizePath);

    brush.call((this.selectionBrush).move, [selectionBrushStart, selectionBrushEnd]);

    if (this.chartType === ChartType.bars) {
      this.applyStyleOnSelectedBars();
      brush.on('dblclick', () => {
        // fully selected
        if (this.multiselectable) {
          (this.barsContext).filter((d) => {
            d.key = +d.key;
            return d.key >= this.selectionInterval.startvalue
              && d.key + this.barWeight * this.dataInterval <= this.selectionInterval.endvalue;
          }).data().map(d => this.selectedBars.add(d.key));
          // party selected
          (this.barsContext).filter((d) => {
            d.key = +d.key;
            return d.key < this.selectionInterval.startvalue
              && d.key + this.barWeight * this.dataInterval > this.selectionInterval.startvalue;
          }).data()
            .map(d => this.selectedBars.add(d.key));

          // party selected
          (this.barsContext).filter((d) => {
            d.key = +d.key;
            return d.key <= this.selectionInterval.endvalue
              && d.key + this.barWeight * this.dataInterval > this.selectionInterval.endvalue;
          }).data()
            .map(d => this.selectedBars.add(d.key));
          this.selectionListInterval.push({ startvalue: this.selectionInterval.startvalue, endvalue: this.selectionInterval.endvalue });
        }
      });
    }
    this.handleOnBrushingEvent();
    this.handleEndOfBrushingEvent();


  }

  private getColor(zeroToOne: number): tinycolorInstance {
    // Scrunch the green/cyan range in the middle

    const sign = (zeroToOne < .5) ? -1 : 1;
    zeroToOne = sign * Math.pow(2 * Math.abs(zeroToOne - .5), .35) / 2 + .5;

    // Linear interpolation between the cold and hot
    if (this.paletteColors === null) {
      const h0 = 259;
      const h1 = 12;
      const h = (h0) * (1 - zeroToOne) + (h1) * (zeroToOne);
      return tinycolor({ h: h, s: 100, v: 90 });
    } else {
      if (this.paletteColors instanceof Array) {
        const h0 = this.paletteColors[1];
        const h1 = this.paletteColors[0];
        const h = (h0) * (1 - zeroToOne) + (h1) * (zeroToOne);
        return tinycolor({ h: h, s: 100, v: 90 });
      } else {
        const color = tinycolor(this.paletteColors.toString());
        const h = color.toHsl().h;
        const s = color.toHsl().s;
        const l0 = 85;
        const l1 = 20;
        const l = (l0) * (1 - zeroToOne) + (l1) * (zeroToOne);
        return tinycolor({ h: h, s: s, l: l });
      }
    }
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
    if (this.inputData.length !== 0) {
      if (selectedInputValues.startvalue < inputData[0].key || selectedInputValues.endvalue > inputData[inputData.length - 1].key) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
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
    if (this.dataLength > 1) {
      this.displaySvg = 'block';
    } else {
      this.displaySvg = 'none';
    }
    const svg = d3.select(this.histogramNode).select('svg');
    const margin = this.margin;
    const width = Math.max(+this.chartWidth - this.margin.left - this.margin.right, 0);
    const height = Math.max(+this.chartHeight - this.margin.top - this.margin.bottom, 0);
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

  // create three axes for X and two for Y
  // For X: - The first axis contains a line only that is always at the bottom of the chart
  //        - The second one contains a line and ticks. Labels are always hidden.
  //        - For the third one, only labels are shown.
  // For Y: - The first axis contains a line and ticks. Labels are always hidden.
  //        - For the second one, only labels are shown.
  private createChartAxes(chartDimensions: ChartDimensions, data: Array<HistogramData>): ChartAxes {
    const xDomain = (this.getXDomainScale()).range([0, chartDimensions.width]);
    // The xDomain extent includes data domain and selected values
    const xDomainExtent = this.getXDomainExtent(data, this.selectionInterval.startvalue, this.selectionInterval.endvalue);
    xDomain.domain(xDomainExtent);
    // xDataDomain includes data domain only
    let xDataDomain;
    let xAxis;
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
      xAxis = d3.axisBottom(xDomain).tickSize(0);
      xTicksAxis = d3.axisBottom(xDomain).ticks(this.xTicks).tickSize(this.minusSign * 5);
      xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).ticks(this.xLabels);
      if (this.dataType === DataType.time && this.ticksDateFormat !== null) {
        xLabelsAxis = xLabelsAxis.tickFormat(d3.timeFormat(this.ticksDateFormat));
      }
    } else {
      if (data.length > 1) {
        stepWidth = xDomain(data[1].key) - xDomain(data[0].key);
      } else {
        if (this.chartType === ChartType.oneDimension) {
          stepWidth = this.chartDimensions.width;
        } else {
          if (data[0].key === this.selectionInterval.startvalue && data[0].key === this.selectionInterval.endvalue) {
            stepWidth = xDomain(data[0].key) / (this.barWeight * 10);
          } else {
            stepWidth = (xDomain(<number>data[0].key + this.dataInterval) - xDomain(data[0].key));
          }
        }
      }
      endRange = xDomain(+data[data.length - 1].key + this.dataInterval);
      xDataDomain = d3.scaleBand().range([startRange, endRange]).paddingInner(0);
      xDataDomain.domain(data.map(function (d) { return d.key; }));
      xTicksAxis = d3.axisBottom(xDomain).tickPadding(5).tickValues(xDataDomain.domain()
        .filter(function (d, i) { return !(i % ticksPeriod); })).tickSize(this.minusSign * 5);
      xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).tickValues(xDataDomain.domain()
        .filter(function (d, i) { return !(i % labelsPeriod); }));
      xAxis = d3.axisBottom(xDomain).tickSize(0);
    }
    const yDomain = d3.scaleLinear().range([chartDimensions.height, 0]);
    yDomain.domain([0, d3.max(data, (d: any) => d.value)]);
    const yTicksAxis = d3.axisLeft(yDomain).ticks(this.yTicks);
    const yLabelsAxis = d3.axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.yLabels);

    return { xDomain, xDataDomain, yDomain, xTicksAxis, yTicksAxis, stepWidth, xLabelsAxis, yLabelsAxis, xAxis };
  }


  // draw three axes for X and two for Y
  // For X: - The first axis contains a line only that is always at the bottom of the chart
  //        - The second one contains a line and ticks. Labels are always hidden.
  //        - For the third one, only labels are shown.
  // For Y: - The first axis contains a line and ticks. Labels are always hidden.
  //        - For the second one, only labels are shown.
  private drawChartAxes(chartDimensions: ChartDimensions, chartAxes: ChartAxes): void {
    const _thisComponent = this;
    const marginTopBottom = chartDimensions.margin.top * this.xAxisPosition + chartDimensions.margin.bottom * (1 - this.xAxisPosition);
    this.context = chartDimensions.svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + marginTopBottom + ')');
    this.xAxis = this.context.append('g')
      .attr('class', 'histogram__only-axis')
      .attr('transform', 'translate(0,' + chartDimensions.height + ')')
      .call(chartAxes.xAxis);
    this.xTicksAxis = this.context.append('g')
      .attr('class', 'histogram__ticks-axis')
      .attr('transform', 'translate(0,' + chartDimensions.height * _thisComponent.xAxisPosition + ')')
      .call(chartAxes.xTicksAxis);
    this.xLabelsAxis = this.context.append('g')
      .attr('class', 'histogram__labels-axis')
      .attr('transform', 'translate(0,' + chartDimensions.height * _thisComponent.xAxisPosition + ')')
      .call(chartAxes.xLabelsAxis);
    this.xTicksAxis.selectAll('path').attr('class', 'histogram__axis');
    this.xAxis.selectAll('path').attr('class', 'histogram__axis');
    this.xTicksAxis.selectAll('line').attr('class', 'histogram__ticks');
    this.xLabelsAxis.selectAll('text').attr('class', 'histogram__labels');
    if (!this.showXTicks) {
      this.xTicksAxis.selectAll('g').attr('class', 'histogram__ticks-axis__hidden');
    }
    if (!this.showXLabels) {
      this.xLabelsAxis.attr('class', 'histogram__labels-axis__hidden');
    }


    if (this.chartType !== ChartType.oneDimension) {
      this.yTicksAxis = this.context.append('g')
        .attr('class', 'histogram__ticks-axis')
        .call(chartAxes.yTicksAxis);
      this.yLabelsAxis = this.context.append('g')
        .attr('class', 'histogram__labels-axis')
        .call(chartAxes.yLabelsAxis);
      // Define css classes for the ticks, labels and the axes
      this.yTicksAxis.selectAll('path').attr('class', 'histogram__axis');
      this.yTicksAxis.selectAll('line').attr('class', 'histogram__ticks');
      this.yLabelsAxis.selectAll('text').attr('class', 'histogram__labels');
      if (!this.showYTicks) {
        this.yTicksAxis.selectAll('g').attr('class', 'histogram__ticks-axis__hidden');
      }
      if (!this.showYLabels) {
        this.yLabelsAxis.attr('class', 'histogram__labels-axis__hidden');
      }
    }
  }

  private plotHistogramData(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    if (this.chartType === ChartType.bars) {
      this.plotHistogramDataAsBars(chartDimensions, chartAxes, data);
    } else if (this.chartType === ChartType.area) {
      this.plotHistogramDataAsArea(chartDimensions, chartAxes, data);
    } else if (this.chartType === ChartType.oneDimension) {
      this.plotHistogramDataAsOneDimension(chartDimensions, chartAxes, data);
    }
  }

  private plotHistogramDataAsBars(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const _thisComponent = this;
    const marginTopBottom = chartDimensions.margin.top * this.xAxisPosition + chartDimensions.margin.bottom * (1 - this.xAxisPosition);
    this.barsContext = chartDimensions.svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'histogram__chart--bar')
      .attr('x', function (d) { return chartAxes.xDataDomain(d.key); })
      .attr('width', chartAxes.stepWidth * _thisComponent.barWeight)
      .attr('y', function (d) { return chartAxes.yDomain(d.value); })
      .attr('height', function (d) { return chartDimensions.height - chartAxes.yDomain(d.value); })
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + marginTopBottom + ')')
      .on('mousemove', function (d) {

        _thisComponent.setTooltipPosition(_thisComponent.tooltipxPositionWeight, -40, d, <d3.ContainerElement>this);
      })
      .on('mouseout', function (d) { _thisComponent.showTooltip = false; });
  }

  private plotHistogramDataAsOneDimension(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const _thisComponent = this;
    this.barWeight = 1;
    this.context.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('x', function (d) { return chartAxes.xDataDomain(d.key); })
      .attr('width', chartAxes.stepWidth * _thisComponent.barWeight)
      .attr('y', function (d) { return chartAxes.yDomain(d.value) * _thisComponent.yDimension; })
      .attr('height', function (d) { return chartDimensions.height - chartAxes.yDomain(d.value) * _thisComponent.yDimension; })
      .style('fill', function (d) { return _thisComponent.getColor(d.value).toHexString(); })
      .style('stroke', function (d) { return _thisComponent.getColor(d.value).toHexString(); });
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
        _thisComponent.setTooltipPosition(-20, -40, d, <d3.ContainerElement>this);
      })
      .on('mouseout', function (d) {
        _thisComponent.showTooltip = false;
      });
  }

  private setTooltipPosition(dx: number, dy: number, data: HistogramData, container: d3.ContainerElement): void {
    this.showTooltip = true;
    this.tooltipXContent = 'x: ' + this.toString(data.key);
    this.tooltipYContent = 'y: ' + data.value + ' ' + this.dataUnit;
    const xy = d3.mouse(container);
    this.tooltipVerticalPosition = (xy[0] + dx) + 'px';
    this.tooltipHorizontalPosition = (xy[1] + dy) + 'px';
  }

  private translateBrushHandles(selection: any) {
    const xTranslation = this.brushHandlesHeight - (this.chartDimensions.height - this.brushHandlesHeight) / 2;
    if (selection !== null) {
      const sx = selection.map(this.chartAxes.xDomain.invert);
      this.brushHandles.attr('display', null).attr('transform', function (d, i) {
        return 'translate(' + [selection[i], -xTranslation] + ')';
      });

    } else {
      this.brushHandles.attr('display', 'none');
    }
  }

  private handleStartOfBrushingEvent(): void {
    if (this.brushHandlesHeightWeight <= 1 && this.brushHandlesHeightWeight > 0) {
      this.brushHandlesHeight = this.chartDimensions.height * this.brushHandlesHeightWeight;
    } else {
      this.brushHandlesHeight = this.chartDimensions.height;
    }
    this.selectionBrush.on('start', () => {
      const selection = d3.event.selection;
      this.translateBrushHandles(selection);
    });
  }

  private handleOnBrushingEvent(): void {
    const _thisComponent = this;
    this.selectionBrush.on('brush', (datum: any, index: number) => {
      const selection = d3.event.selection;
      if (selection !== null) {
        this.selectionInterval.startvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[0];
        this.selectionInterval.endvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[1];
        this.startValue = 'From ' + this.toString(this.selectionInterval.startvalue);
        this.endValue = ' to ' + this.toString(this.selectionInterval.endvalue);
        this.showTitle = false;

        if (this.chartType === ChartType.bars) {
          this.applyStyleOnSelectedBars();
        }
      }
      this.translateBrushHandles(selection);
      this.isbrush = true;
    });
  }

  private handleEndOfBrushingEvent(): void {
    const _thisComponent = this;
    this.selectionBrush.on('end', (datum: any, index: number) => {
      const selection = d3.event.selection;
      if (selection !== null) {
        const newStartValue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[0];
        const newEndvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[1];

        if ((!this.fromSetInterval) && this.isbrush) {
          this.selectionInterval.startvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[0];
          this.selectionInterval.endvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[1];
          this.startValue = this.toString(this.selectionInterval.startvalue);
          this.endValue = this.toString(this.selectionInterval.endvalue);
          this.valuesListChangedEvent.next(this.selectionListInterval.concat(this.selectionInterval));
        }
        this.showTitle = true;
        this.isbrush = false;
      }
    });
  }

  private applyStyleOnSelectedBars(): void {
    let key;
    (this.barsContext).filter((d) => {
      key = d.key;
      d.key = +d.key;
      return this.selectedBars.has(key);
    })
      .attr('class', 'histogram__chart--bar__fullyselected');
    (this.barsContext).filter((d) => {
      key = d.key;
      d.key = +d.key;
      return d.key >= this.selectionInterval.startvalue &&
        d.key + this.barWeight * this.dataInterval <= this.selectionInterval.endvalue;
    })
      .attr('class', 'histogram__chart--bar__fullyselected');
    (this.barsContext).filter((d) => {
      key = d.key;
      d.key = +d.key;
      return ((d.key < this.selectionInterval.startvalue || d.key > this.selectionInterval.endvalue) && (!this.selectedBars.has(key)));
    })
      .attr('class', 'histogram__chart--bar');
    (this.barsContext).filter((d) => {
      key = d.key;
      d.key = +d.key;
      return d.key < this.selectionInterval.startvalue && (!this.selectedBars.has(key))
        && d.key + this.barWeight * this.dataInterval > this.selectionInterval.startvalue;
    })
      .attr('class', 'histogram__chart--bar__partlyselected');
    (this.barsContext).filter((d) => {
      key = d.key;
      d.key = +d.key;
      return d.key <= this.selectionInterval.endvalue && (!this.selectedBars.has(key))
        && d.key + this.barWeight * this.dataInterval > this.selectionInterval.endvalue;
    })
      .attr('class', 'histogram__chart--bar__partlyselected');
  }

  private toString(value: Date | number): string {
    if (value instanceof Date) {
      if (this.valuesDateFormat !== null) {
        const timeFormat = d3.timeFormat(this.valuesDateFormat);
        return timeFormat(value);
      } else {
        return value.toDateString();
      }
    } else {
      if (this.chartType === ChartType.oneDimension) {
        return Math.trunc(value).toString();
      } else {
        return this.round(value, 1).toString();
      }
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
      if (this.dateUnit === DateUnit.second && (typeof (<Date>selectedValues.startvalue).getMonth !== 'function')) {
        const multiplier = 1000;
        parsedSelectedValues.startvalue = new Date(<number>selectedValues.startvalue * multiplier);
        parsedSelectedValues.endvalue = new Date(<number>selectedValues.endvalue * multiplier);
      } else if ((typeof (<Date>selectedValues.startvalue).getMonth === 'function')) {
        parsedSelectedValues.startvalue = new Date(<Date>selectedValues.startvalue);
        parsedSelectedValues.endvalue = new Date(<Date>selectedValues.endvalue);
      } else {
        parsedSelectedValues.startvalue = new Date(<number>selectedValues.startvalue);
        parsedSelectedValues.endvalue = new Date(<number>selectedValues.endvalue);
      }
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

  private getXDomainExtent(data: Array<HistogramData>, selectedStartValue: Date | number,
    selectedEndValue: Date | number): Array<Date | number | { valueOf(): number }> {
    this.dataInterval = 0;
    if (this.chartType !== ChartType.area) {
      this.dataInterval = this.getBucketInterval(data, selectedStartValue, selectedEndValue);
    }
    const xDomainExtent = new Array<Date | number | { valueOf(): number }>();
    const dataKeyUnionSelectedValues = new Array<Date | number>();
    data.forEach(d => {
      dataKeyUnionSelectedValues.push(d.key);
    });
    dataKeyUnionSelectedValues.push(selectedStartValue);
    dataKeyUnionSelectedValues.push(selectedEndValue);
    if (this.dataType === DataType.time) {
      xDomainExtent.push(new Date(d3.min(dataKeyUnionSelectedValues, (d: Date) => d).getTime() - this.dataInterval));
      xDomainExtent.push(new Date(d3.max(dataKeyUnionSelectedValues, (d: Date) => d).getTime() + this.dataInterval));
    } else {
      xDomainExtent.push(d3.min(dataKeyUnionSelectedValues, (d: number) => d) * 1 - this.dataInterval * this.yDimension);
      xDomainExtent.push(d3.max(dataKeyUnionSelectedValues, (d: number) => d) * 1 + this.dataInterval);
    }
    return xDomainExtent;
  }

  private getBucketInterval(data: Array<{ key: any, value: number }>, selectedStartValue: Date | number,
    selectedEndValue: Date | number): number {
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
    } else {
      // three cases
      if (data[0].key === selectedStartValue && data[0].key === selectedEndValue) {
        interval = 1;
      } else if (data[0].key === selectedStartValue || data[0].key === selectedEndValue) {
        const isoInterval = Math.max(Math.abs(data[0].key - <number>selectedStartValue), Math.abs(data[0].key - <number>selectedEndValue));
        interval = Math.min(1, isoInterval);
      } else {
        interval = Math.min(1, Math.abs(data[0].key - <number>selectedStartValue), Math.abs(data[0].key - <number>selectedEndValue));
      }
    }
    return interval;
  }

}
