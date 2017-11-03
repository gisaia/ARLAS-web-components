import {
  Component, OnInit, Input, Output, ViewEncapsulation,
  ViewContainerRef, ElementRef, OnChanges, SimpleChanges, AfterViewChecked
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
import { SelectedInputValues, SwimlaneData, SwimlaneParsedData, Tooltip} from './histogram.utils';

@Component({
  selector: 'arlas-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HistogramComponent implements OnInit, OnChanges, AfterViewChecked {


  public HISTOGRAM_BARS = 'histogramm__bars';
  public ChartType = ChartType;
  public Array = Array;
  public margin: MarginModel = { top: 4, right: 10, bottom: 20, left: 60 };
  public startValue: string = null;
  public endValue: string = null;
  public showTooltip = false;
  public showTitle = true;
  public tooltipHorizontalPosition = '0';
  public tooltipVerticalPosition = '0';
  public tooltipXContent: string;
  public tooltipYContent: string;

  public inputData: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>;
  public dataLength: number;
  public displaySvg = 'none';
  public brushHandles;
  public brushHandlesHeight: number = null;
  public swimlaneTooltipsMap = new Map<string, Tooltip>();
  public verticalTooltipLine;

  @Input() public xTicks = 5;
  @Input() public yTicks = 5;
  @Input() public chartType: ChartType = ChartType.area;
  @Input() public chartTitle = '';
  @Input() public chartWidth: number = null;
  @Input() public chartHeight: number = null;
  @Input() public swimLaneLabelsWidth = null;
  @Input() public dataType: DataType = DataType.numeric;
  @Input() public customizedCssClass = '';
  @Input() public dataUnit = '';
  @Input() public data: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>;
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
  @Input() public isSwimlaneTickGuide = false;


  @Output() public valuesListChangedEvent: Subject<SelectedOutputValues[]> = new Subject<SelectedOutputValues[]>();

  private histogramNode: any;
  private histogramElement: ElementRef;
  private histogramTitle: string;
  private context: any;
  private barsContext: any;
  private swimlaneContextList = new Array<any>();
  private selectionInterval: SelectedOutputValues = { startvalue: null, endvalue: null };
  private selectionListInterval: SelectedOutputValues[] = [];
  private selectedBars = new Set();
  private selectionBrush: d3.BrushBehavior<any>;
  private chartAxes: ChartAxes;
  private chartDimensions: ChartDimensions;
  private hasSelectionExceededData = false;
  private fromSetInterval = false;
  private dataInterval: number;
  private nbSwimlanes = 1;
  private xTicksAxis;
  private xLabelsAxis;
  private xAxis;
  private yTicksAxis;
  private yLabelsAxis;
  private isWidthFixed = false;
  private isHeightFixed = false;

  private isBrushing = false;
  // Counter of how many times the chart has been plotted/replotted
  private plottingCount = 0;
  private minusSign = 1;
  // yDimension = 0 for one dimension charts and swimlane
  private yDimension = 1;
  // swimlaneDimension = 1 for swimlane
  private swimlaneDimension = 0;
  private tooltipxPositionWeight = 40;
  private onInit = true;
  private brushContext;
  private swimlaneMaxValuesMap: Map<string, number>;
  private labelsContext;

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
      if (this.intervalSelection !== undefined && this.chartType !== ChartType.swimlane &&
         (<Array<{ key: number, value: number }>>this.data).length > 0) {
        this.setSelectedInterval(this.intervalSelection);
      }
      this.fromSetInterval = false;
    }
    // to draw the chart on init with correct width
    if (changes.data) {
      if (changes.data.previousValue !== undefined) {
        if (changes.data.previousValue.length === 0 && this.onInit) {
          this.resizeHistogram(null);
          this.onInit = false;
        }
      }
    }
    if (changes.intervalListSelection) {
      if (changes.intervalListSelection.currentValue) {
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

  public ngAfterViewChecked() {
    if (this.labelsContext !== undefined) {
      this.labelsContext.selectAll('text').each(() => {
        const self = d3.select(this.labelsContext.selectAll('text').node());
        let textLength = self.node().getComputedTextLength();
        let text = self.text();
        while (textLength > (this.swimLaneLabelsWidth) && text.length > 0) {
          text = text.slice(0, -1);
          self.text(text + '...');
          textLength = self.node().getComputedTextLength();
        }
      });
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

    // if (!this.isHistogramSelectable) {
    //   this.margin.right = 0;
    //   this.margin.left = 5;
    // }
  }

  public plotHistogramChart(inputData: Array<{ key: number, value: number }>): void {
    let data: Array<HistogramData>;
    if (inputData !== null && Array.isArray(inputData) && inputData.length > 0) {
      data = this.parseDataKey(<Array<{ key: number, value: number }>>inputData);
      this.initializeDescriptionValues(data[0].key, data[data.length - 1].key);
      this.chartDimensions = this.initializeChartDimensions();
      this.chartAxes = this.createChartAxes(this.chartDimensions, data);
      this.drawChartAxes(this.chartDimensions, this.chartAxes);
      this.plotHistogramData(this.chartDimensions, this.chartAxes, data);
      this.showTooltips(data);
      this.addSelectionBrush();
    } else {
      this.startValue = '';
      this.endValue = '';
      this.dataLength = 0;
    }
  }

  public plotHistogramSwimlane(inputData: Map<string, Array<{ key: number, value: number }>>) {
    let swimlanesMapData: Map<string, Array<HistogramData>> = null;
    if (inputData !== null &&  inputData.size > 0) {
      swimlanesMapData = this.parseSwimlaneDataKey(<Map<string, Array<{ key: number, value: number }>>>inputData);
      this.nbSwimlanes = swimlanesMapData.size;
      const firstKey = swimlanesMapData.keys().next().value;
      this.initializeDescriptionValues(swimlanesMapData.get(firstKey)[0].key,
       swimlanesMapData.get(firstKey)[swimlanesMapData.get(firstKey).length - 1].key);
      this.chartDimensions = this.initializeChartDimensions();
      this.chartAxes = this.createChartAxes(this.chartDimensions, swimlanesMapData.get(firstKey));
      this.drawChartAxes(this.chartDimensions, this.chartAxes);
      this.addLabels(swimlanesMapData);
      this.plotHistogramDataAsSwimlane(swimlanesMapData);
      this.showTooltipsForSwimlane(swimlanesMapData);
      this.addSelectionBrush();
    } else {
      this.startValue = '';
      this.endValue = '';
      this.dataLength = 0;
    }
  }

  public addLabels(swimlanesMapData: Map<string, Array<HistogramData>>) {
    const swimlaneHeight = this.chartDimensions.height / (swimlanesMapData.size);
    this.labelsContext = this.context.append('g').classed('foreignObject', true);
    let i = 0;
    swimlanesMapData.forEach((swimlane, key) => {
      this.labelsContext.append('text')
        .text(() => key)
        .attr('transform', 'translate(0,' + swimlaneHeight * (i + 0.6) + ')');
      i++;
    });
  }

  public plotHistogram(inputData: Array<{ key: number, value: number }> |Map<string, Array<{ key: number, value: number }>>): void {
    this.inputData = inputData;
    this.setHistogramMargins();

    // if there is data already ploted, remove it
    if (this.context) {
      this.context.remove();
    }
    if (this.barsContext) {
      this.barsContext.remove();
    }

    if (this.chartType !== ChartType.swimlane) {
      this.plotHistogramChart(<Array<{ key: number, value: number }>>inputData);
    } else {
      this.plotHistogramSwimlane(<Map<string, Array<{ key: number, value: number }>>>inputData);
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
    if (this.chartType === ChartType.bars) {
      this.applyStyleOnSelectedBars(this.barsContext);
    }
    if (this.chartType === ChartType.swimlane) {
      this.applyStyleOnSelectedSwimlanes();
    }
  }

  private addSelectionBrush(): void {
    this.selectionBrush = d3.brushX().extent([[this.chartAxes.stepWidth * this.yDimension, 0],
      [(this.chartDimensions).width, (this.chartDimensions).height]]);
    const selectionBrushStart = Math.max(0, this.chartAxes.xDomain(this.selectionInterval.startvalue));
    const selectionBrushEnd = Math.min(this.chartAxes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
    this.verticalTooltipLine = this.context.append('g').append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', this.chartDimensions.height)
      .style('stroke-width', 2)
      .style('stroke', '#000')
      .style('fill', 'none')
      .style('display', 'none');
    const brush = this.context.append('g')
      .attr('class', 'brush')
      .attr('transform', 'translate(' + this.swimLaneLabelsWidth * this.swimlaneDimension + ', 0)')
      .call(this.selectionBrush);

    this.handleStartOfBrushingEvent();

    const brushResizePath = (d) => {
      const e = +(d.type === 'e'),
        x = e ? 1 : -1,
        y = this.brushHandlesHeight;
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
      .style('z-index', '30000')
      .attr('d', brushResizePath)
      .on('mouseover', () => this.isBrushing = true)
      .on('mouseout', () => this.isBrushing = false);

    brush.call((this.selectionBrush).move, [selectionBrushStart, selectionBrushEnd]);
    if (this.chartType === ChartType.bars) {
      this.applyStyleOnSelectedBars(this.barsContext);
    }
    if (this.chartType === ChartType.swimlane) {
      this.applyStyleOnSelectedSwimlanes();
    }
    if (this.chartType === ChartType.bars || this.chartType === ChartType.swimlane) {
      brush.on('dblclick', () => {
        if (this.multiselectable) {
          // fully selected
          this.barsContext.filter((d) => +d.key >= this.selectionInterval.startvalue
            && +d.key + this.barWeight * this.dataInterval <= this.selectionInterval.endvalue)
            .data().map(d => this.selectedBars.add(+d.key));

           // party selected
          this.barsContext.filter((d) => +d.key < this.selectionInterval.startvalue
            && +d.key + this.barWeight * this.dataInterval > this.selectionInterval.startvalue)
            .data().map(d => this.selectedBars.add(+d.key));

          // party selected
          this.barsContext.filter((d) => +d.key <= this.selectionInterval.endvalue
            && +d.key + this.barWeight * this.dataInterval > this.selectionInterval.endvalue)
            .data().map(d => this.selectedBars.add(+d.key));

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
        if (this.isSelectionBeyondDataDomain(selectedInputValues, <Array<{ key: number, value: number }>>this.inputData)) {
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
    if ((<Array<{ key: number, value: number }>>this.inputData).length !== 0) {
      return selectedInputValues.startvalue < inputData[0].key || selectedInputValues.endvalue > inputData[inputData.length - 1].key;
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

  private initializeDescriptionValues(start: Date | number, end: Date | number) {
    if (this.startValue == null || this.startValue === '') {
      this.startValue = this.toString(start);
      this.selectionInterval.startvalue = start;
    }
    if (this.endValue == null || this.endValue === '') {
      this.endValue = this.toString(end);
      this.selectionInterval.endvalue = end;
    }
  }

  private initializeChartDimensions(): ChartDimensions {
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

    // Set swimlane label width to 20 % of the Histogram Width when it's not specified in the input
    if (this.chartType === ChartType.swimlane) {
      if (this.swimLaneLabelsWidth === null) {
        this.swimLaneLabelsWidth = this.chartWidth * 20 / 100;
      }
      this.yDimension = 0;
      this.swimlaneDimension = 1;
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
    return (this.dataType === DataType.time) ? d3.scaleTime() : d3.scaleLinear();
  }

  // create three axes for X and two for Y
  // For X: - The first axis contains a line only that is always at the bottom of the chart
  //        - The second one contains a line and ticks. Labels are always hidden.
  //        - For the third one, only labels are shown.
  // For Y: - The first axis contains a line and ticks. Labels are always hidden.
  //        - For the second one, only labels are shown.
  private createChartAxes(chartDimensions: ChartDimensions, data: Array<HistogramData>): ChartAxes {
    const xDomain = (this.getXDomainScale()).range([0, chartDimensions.width - (1 - this.yDimension) * this.swimLaneLabelsWidth]);
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

      if (this.dataType === DataType.numeric) {
        xTicksAxis = d3.axisBottom(xDomain).tickPadding(5).tickValues(xDataDomain.domain()
        .filter(function (d, i) { return !(i % ticksPeriod); })).tickSize(this.minusSign * 5);
        xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).tickValues(xDataDomain.domain()
        .filter(function (d, i) { return !(i % labelsPeriod); }));
      } else {
        xTicksAxis = d3.axisBottom(xDomain).ticks(this.xTicks).tickSize(this.minusSign * 5);
        xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).ticks(this.xLabels);
      }
      xAxis = d3.axisBottom(xDomain).tickSize(0);
    }
    let yDomain = null;
    let yTicksAxis = null;
    let yLabelsAxis = null;

    if (this.chartType !== ChartType.swimlane) {
      yDomain = d3.scaleLinear().range([chartDimensions.height, 0]);
      yDomain.domain([0, d3.max(data, (d: any) => d.value)]);
      yTicksAxis = d3.axisLeft(yDomain).ticks(this.yTicks);
      yLabelsAxis = d3.axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.yLabels);
    }
    return { xDomain, xDataDomain, yDomain, xTicksAxis, yTicksAxis, stepWidth, xLabelsAxis, yLabelsAxis, xAxis };
  }


  // draw three axes for X and two for Y
  // For X: - The first axis contains a line only that is always at the bottom of the chart
  //        - The second one contains a line and ticks. Labels are always hidden.
  //        - For the third one, only labels are shown.
  // For Y: - The first axis contains a line and ticks. Labels are always hidden.
  //        - For the second one, only labels are shown.
  private drawChartAxes(chartDimensions: ChartDimensions, chartAxes: ChartAxes): void {
    const marginTopBottom = chartDimensions.margin.top * this.xAxisPosition + chartDimensions.margin.bottom * (1 - this.xAxisPosition);
    const swimLaneLabelsWidth = this.swimlaneDimension * this.swimLaneLabelsWidth;
    this.context = chartDimensions.svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + marginTopBottom + ')');
    const allAxesContext = this.context.append('g').attr('class', 'histogram__all-axes');
    this.xAxis = allAxesContext.append('g')
      .attr('class', 'histogram__only-axis')
      .attr('transform', 'translate(' + swimLaneLabelsWidth + ',' + chartDimensions.height + ')')
      .call(chartAxes.xAxis);
    this.xTicksAxis = allAxesContext.append('g')
      .attr('class', 'histogram__ticks-axis')
      .attr('transform', 'translate(' + swimLaneLabelsWidth + ',' + chartDimensions.height * this.xAxisPosition + ')')
      .call(chartAxes.xTicksAxis);
    this.xLabelsAxis = allAxesContext.append('g')
      .attr('class', 'histogram__labels-axis')
      .attr('transform', 'translate(' + swimLaneLabelsWidth + ',' + chartDimensions.height * this.xAxisPosition + ')')
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
    if (this.chartType === ChartType.swimlane ) {
      this.drawLineSeparators(allAxesContext);
    }
    if (this.chartType !== ChartType.oneDimension && this.chartType !== ChartType.swimlane ) {
      this.yTicksAxis = allAxesContext.append('g')
        .attr('class', 'histogram__ticks-axis')
        .call(chartAxes.yTicksAxis);
      this.yLabelsAxis = allAxesContext.append('g')
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
    } else if (this.chartType === ChartType.swimlane) {
      this.xTicksAxis.call(chartAxes.xTicksAxis.tickSize(-chartDimensions.height * this.swimlaneDimension));
    }
  }

  private drawLineSeparators(allAxesContext): void  {
    const swimlaneHeight = this.chartDimensions.height / this.nbSwimlanes;
    for (let i = 0; i <= (<Map<string, Array<{ key: number, value: number }>>>this.inputData).size; i++) {
      allAxesContext.append('g')
      .attr('class', 'histogram__line-separator')
      .attr('transform', 'translate(' + this.swimlaneDimension * this.swimLaneLabelsWidth + ',' + swimlaneHeight * i + ')')
      .call(this.chartAxes.xAxis);
    }
  }

  private plotHistogramData(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    if (this.chartType === ChartType.bars) {
      this.plotHistogramDataAsBars(chartDimensions, chartAxes, data);
    } else if (this.chartType === ChartType.area) {
      this.plotHistogramDataAsArea(chartDimensions, chartAxes, data);
    } else if (this.chartType === ChartType.oneDimension) {
      this.plotHistogramDataAsOneDimension(chartAxes, data, chartDimensions.height, 1, 1);
    }
  }

  private plotHistogramDataAsBars(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const marginTopBottom = chartDimensions.margin.top * this.xAxisPosition + chartDimensions.margin.bottom * (1 - this.xAxisPosition);
    this.barsContext = this.context.append('g').attr('class', this.HISTOGRAM_BARS).selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'histogram__chart--bar')
      .attr('x', function (d) { return chartAxes.xDataDomain(d.key); })
      .attr('width', chartAxes.stepWidth * this.barWeight)
      .attr('y', function (d) { return chartAxes.yDomain(d.value); })
      .attr('height', function (d) { return chartDimensions.height - chartAxes.yDomain(d.value); });
  }

  private plotHistogramDataAsOneDimension(chartAxes: ChartAxes,
   data: Array<HistogramData>, barHeight: number, barWeight: number, dataMaxValue): any {
    return this.barsContext = this.context.append('g').attr('class', 'histogram__onedimension-data')
      .selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('x', (d) => chartAxes.xDataDomain(d.key))
      .attr('width', chartAxes.stepWidth * barWeight)
      .attr('height', function (d) { return barHeight; })
      .style('fill', (d) => this.getColor(d.value / dataMaxValue).toHexString())
      .style('stroke', (d) => this.getColor(d.value / dataMaxValue).toHexString())
      .style('opacity', '0.8');
  }

  private plotHistogramDataAsArea(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const curveType: d3.CurveFactory = (this.isSmoothedCurve) ? d3.curveMonotoneX : d3.curveLinear;
    const area = d3.area()
      .curve(curveType)
      .x((d: any) => chartAxes.xDataDomain(d.key))
      .y0(chartDimensions.height)
      .y1((d: any) => chartAxes.yDomain(d.value));
    this.context.append('g').attr('class', 'histogram__area-data')
      .append('path')
      .datum(data)
      .attr('class', 'histogram__chart--area')
      .attr('d', area);
  }


  private plotHistogramDataAsSwimlane(swimlaneData: Map<string, Array<HistogramData>>): void {
    const swimlaneHeight = this.chartDimensions.height / (swimlaneData.size);
    const keys = swimlaneData.keys();
    for (let i = 0; i < swimlaneData.size ; i++) {
      const key = keys.next().value;
      this.plotHistogramDataAsOneDimension(this.chartAxes, swimlaneData.get(key), swimlaneHeight - 5, this.barWeight,
          this.swimlaneMaxValuesMap.get(key))
        .attr('y', swimlaneHeight * (i))
        .attr('height', (d) => (d.value !== 0) ? this.getSwimlaneContentHeight(swimlaneHeight,
          d.value, this.swimlaneMaxValuesMap.get(key)) : 0)
        .attr('transform', (d) => 'translate(' + this.swimLaneLabelsWidth + ','
        + this.getSwimlaneVerticalTranslation(swimlaneHeight, d.value, this.swimlaneMaxValuesMap.get(key), i) + ')');

      this.swimlaneContextList.push(this.barsContext);
      if (this.isSwimlaneTickGuide) {
        this.plotHorizontalTicksForSwimlane(swimlaneData.get(key), swimlaneHeight, this.barWeight, this.swimlaneMaxValuesMap.get(key), i);
      }
    }
  }

  private getSwimlaneContentHeight(swimlaneHeight: number, swimlaneValue?: number, swimlaneMaxValue?: number): number {
    return (this.isSwimlaneTickGuide) ? swimlaneHeight - 5 : swimlaneValue * swimlaneHeight / swimlaneMaxValue;
  }

  private getSwimlaneVerticalTranslation(swimlaneHeight: number, swimlaneValue?: number,
    swimlaneMaxValue?: number, indexOfSwimlane?: number): number {
    return (this.isSwimlaneTickGuide) ? swimlaneHeight * indexOfSwimlane + 3
    : swimlaneHeight - swimlaneValue * swimlaneHeight / swimlaneMaxValue;
  }

  private plotHorizontalTicksForSwimlane(data: Array<HistogramData>, swimlaneHeight: number, barWeight: number, dataMaxValue, index) {
    this.context.append('g').attr('class', 'histogram__swimlane-height')
    .selectAll('path')
    .data(data)
    .enter().append('line')
    .attr('x1', (d) => this.swimLaneLabelsWidth + this.chartAxes.xDataDomain(d.key))
    .attr('y1', (d) => swimlaneHeight * (index + 1) - (+d.value) * swimlaneHeight / (+dataMaxValue))
    .attr('x2', (d) => this.swimLaneLabelsWidth + this.chartAxes.xDataDomain(d.key) + this.chartAxes.stepWidth * barWeight)
    .attr('y2', (d) => swimlaneHeight * (index + 1) - (+d.value) * swimlaneHeight / (+dataMaxValue))
    .style('stroke-width', 0.5)
    .style('stroke', '#000')
    .style('fill', 'none')
    .style('opacity', '1');
  }

  private showTooltips(data: Array<HistogramData>): void {
    if (this.dataUnit !== '') {
      this.dataUnit = '(' + this.dataUnit + ')';
    }
    this.context
    .on('mousemove', () => this.setTooltipPosition(data, <d3.ContainerElement>this.context.node()))
    .on('mouseout', () => this.showTooltip = false);
  }

  private showTooltipsForSwimlane(swimlaneMapData: Map<string, Array<HistogramData>>): void {
    this.context
    .on('mousemove', () => {
      let i = 0;
      swimlaneMapData.forEach((swimlane, key) => {
        this.setTooltipPositionForSwimlane(swimlane, key, i, swimlaneMapData.size, <d3.ContainerElement>this.context.node());
        i++;
      });
    })
    .on('mouseout', () => {
        this.swimlaneTooltipsMap.forEach((tooltipPositon, key) => {
          const hiddenTooltip: Tooltip = {isShown: false, xPosition: 0, yPosition: 0, xContent: '', yContent: ''};
          this.swimlaneTooltipsMap.set(key, hiddenTooltip);
      });
      this.verticalTooltipLine.style('display', 'none');
    });
  }

  private setTooltipPosition(data: Array<HistogramData>, container: d3.ContainerElement): void {
    const xy = d3.mouse(container);
    let dx;
    let dy;
    let startPosition;
    let endPosition;
    for (let i = 0; i < data.length; i++) {
      switch (this.chartType) {
        case ChartType.bars:
        case ChartType.oneDimension: {
          startPosition = this.swimLaneLabelsWidth * this.swimlaneDimension + this.chartAxes.xDomain(data[i].key);
          endPosition = startPosition + this.chartAxes.stepWidth * this.barWeight;
          dx = 70;
          dy = 0;
          break;
        }
        case ChartType.area: {
          startPosition = this.chartAxes.xDomain(data[i].key) - 10;
          endPosition = this.chartAxes.xDomain(data[i].key) + 10;
          dx = 70;
          dy = 0;
          break;
        }
        default: break;
      }
      if ( xy[0] >= startPosition && xy[0] < endPosition && !this.isBrushing) {
        this.showTooltip = true;
        this.tooltipXContent = 'x: ' + this.toString(data[i].key);
        this.tooltipYContent = 'y: ' + data[i].value;
        break;
      } else {
        this.showTooltip = false;
      }
    }
    this.tooltipVerticalPosition = (xy[0] + dx) + 'px';
    this.tooltipHorizontalPosition = (xy[1] + dy) + 'px';
  }

  private setTooltipPositionForSwimlane(data: Array<HistogramData>, key: string, indexOfKey: number, numberOfSwimlane: number,
     container: d3.ContainerElement): void {
    const swimlaneHeight = this.chartDimensions.height / numberOfSwimlane;
    const xy = d3.mouse(container);
    let dx;
    let dy;
    let startPosition;
    let endPosition;
    let middlePosition;
    for (let i = 0; i < data.length; i++) {
      startPosition = this.swimLaneLabelsWidth * this.swimlaneDimension + this.chartAxes.xDomain(data[i].key);
      endPosition = startPosition + this.chartAxes.stepWidth * this.barWeight;
      middlePosition = startPosition + this.chartAxes.stepWidth * this.barWeight / 2;
      dx = 25 ;
      dy = -15;

      if ( xy[0] >= startPosition && xy[0] < endPosition && !this.isBrushing) {
        this.verticalTooltipLine.style('display', 'block').attr('transform', 'translate(' + middlePosition + ',' + '0)');
        const xContent = (indexOfKey === 0) ? 'x: ' + this.toString(data[i].key) : null ;
        const tooltip: Tooltip = {isShown: true,
          xPosition: (xy[0] + dx),
          yPosition: swimlaneHeight * (indexOfKey + 0.6) + dy,
          xContent: xContent,
          yContent: 'y: ' + data[i].value
        };
        this.swimlaneTooltipsMap.set(key, tooltip);
        break;
      } else {
        const hiddenTooltip: Tooltip = {isShown: false, xPosition: 0, yPosition: 0, xContent: '', yContent: ''};
        this.swimlaneTooltipsMap.set(key, hiddenTooltip);
        this.verticalTooltipLine.style('display', 'none');
      }
    }

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
    this.selectionBrush.on('brush', (datum: any, index: number) => {
      this.isBrushing = true;
      const selection = d3.event.selection;
      if (selection !== null) {
        this.selectionInterval.startvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[0];
        this.selectionInterval.endvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[1];
        this.startValue = 'From ' + this.toString(this.selectionInterval.startvalue);
        this.endValue = ' to ' + this.toString(this.selectionInterval.endvalue);
        this.showTitle = false;
        if (this.chartType === ChartType.bars) {
          this.applyStyleOnSelectedBars(this.barsContext);
        }
        if (this.chartType === ChartType.swimlane) {
          this.applyStyleOnSelectedSwimlanes();
        }
      }
      this.translateBrushHandles(selection);
    });
  }

  private handleEndOfBrushingEvent(): void {
    this.selectionBrush.on('end', (datum: any, index: number) => {
      const selection = d3.event.selection;
      if (selection !== null) {
        const newStartValue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[0];
        const newEndvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[1];
        if ((!this.fromSetInterval) && this.isBrushing) {
          this.selectionInterval.startvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[0];
          this.selectionInterval.endvalue = selection.map(this.chartAxes.xDomain.invert, this.chartAxes.xDomain)[1];
          this.startValue = this.toString(this.selectionInterval.startvalue);
          this.endValue = this.toString(this.selectionInterval.endvalue);
          this.valuesListChangedEvent.next(this.selectionListInterval.concat(this.selectionInterval));
        }
        this.showTitle = true;
        this.isBrushing = false;
      }
    });
  }

  private applyStyleOnSelectedBars(barsContext): void {

    barsContext.filter((d) => this.selectedBars.has(+d.key)).attr('class', 'histogram__chart--bar__fullyselected');

    barsContext.filter((d) => +d.key >= this.selectionInterval.startvalue
      && +d.key + this.barWeight * this.dataInterval <= this.selectionInterval.endvalue)
    .attr('class', 'histogram__chart--bar__fullyselected');

    barsContext.filter((d) => (+d.key < this.selectionInterval.startvalue || +d.key > this.selectionInterval.endvalue)
      && (!this.selectedBars.has(+d.key)))
    .attr('class', 'histogram__chart--bar');

    barsContext.filter((d) => +d.key < this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
      && +d.key + this.barWeight * this.dataInterval > this.selectionInterval.startvalue)
    .attr('class', 'histogram__chart--bar__partlyselected');

    barsContext.filter((d) => +d.key <= this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
      && +d.key + this.barWeight * this.dataInterval > this.selectionInterval.endvalue)
    .attr('class', 'histogram__chart--bar__partlyselected');
  }

  private applyStyleOnSelectedSwimlanes(): void {
    this.swimlaneContextList.forEach(swimlaneContext => this.applyStyleOnSelectedBars(swimlaneContext));
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
      return (this.chartType === ChartType.oneDimension) ? Math.trunc(value).toString() : this.round(value, 1).toString();
    }
  }


  private parseDataKey(inputData: Array<{ key: number, value: number }>, lane?: string): Array<HistogramData> {
    this.dataLength = inputData.length;
    if (lane) {
      this.setSwimlaneMaxValues(inputData, lane);
    }
    return (this.dataType === DataType.time) ? this.parseDataKeyToDate(inputData) : inputData;
  }

  /**
   * each swimlane is has a key which is a string and a value which is a key-value array as for a single simple chart
   */
  private parseSwimlaneDataKey(swimlanesInputData: Map<string, Array<{ key: number, value: number }>>):
  Map<string, Array<HistogramData>> {
    const swimlaneParsedDataMap = new Map<string, Array<HistogramData>>();
    this.swimlaneMaxValuesMap = new Map<string, number>();
    swimlanesInputData.forEach((swimlane, key) => {
      if (swimlane !== null && Array.isArray(swimlane) && swimlane.length > 0) {
        swimlaneParsedDataMap.set(key, this.parseDataKey(swimlane, key));
      }
    });
    return swimlaneParsedDataMap;
  }

  private parseDataKeyToDate(inputData: Array<{ key: number, value: number }>, lane?: string) {
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

  private setSwimlaneMaxValues(inputData: Array<{ key: number, value: number }>, lane: string) {
    let maxValue = 0;
    inputData.forEach(d => {
      if (maxValue < d.value) { maxValue = d.value; }
    });
    if (lane) { this.swimlaneMaxValuesMap.set(lane, maxValue); }
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
