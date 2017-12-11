import {
  Component, OnInit, Input, Output, ViewEncapsulation,
  ViewContainerRef, ElementRef, OnChanges, SimpleChanges, AfterViewChecked
} from '@angular/core';

import {
  ChartType, ChartDimensions, ChartAxes, Tooltip, DataType, HistogramData,
  MarginModel, DateUnit, SelectedInputValues, SelectedOutputValues, Position
} from './histogram.utils';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as d3 from 'd3';
import * as tinycolor from 'tinycolor2';
import { SwimlaneData, SwimlaneParsedData, SwimlaneMode, SwimlaneAxes } from './histogram.utils';
import { NUMBER_TYPE } from '@angular/compiler/src/output/output_ast';
import { element } from 'protractor';

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
  public showTitle = true;
  public tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
  public inputData: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>;
  public dataLength: number;
  public displaySvg = 'none';
  public brushHandles;
  public brushHandlesHeight: number = null;
  public swimlaneTooltipsMap = new Map<string, Tooltip>();
  public swimlaneXTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
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
  @Input() public swimlaneMode: SwimlaneMode = SwimlaneMode.variableHeight;
  @Input() public topOffsetRemoveInterval = 40;
  @Input() public leftOffsetRemoveInterval = 18;
  @Input() public swimlaneBorderRadius = 3;
  @Input() public swimlaneHeight: number = null;


  @Output() public valuesListChangedEvent: Subject<SelectedOutputValues[]> = new Subject<SelectedOutputValues[]>();

  private histogramNode: any;
  private histogramElement: ElementRef;
  private histogramTitle: string;
  private context: any;
  private barsContext: any;
  private swimlaneContextList = new Array<any>();
  private selectionInterval: SelectedOutputValues = { startvalue: null, endvalue: null };
  private selectedBars = new Set();
  private selectionBrush: d3.BrushBehavior<any>;
  private chartAxes: ChartAxes;
  private swimlaneAxes: SwimlaneAxes;
  private chartDimensions: ChartDimensions;
  private hasSelectionExceededData = false;
  private fromSetInterval = false;
  private dataInterval: number;
  public nbSwimlanes = 1;
  private xTicksAxis;
  private xLabelsAxis;
  private xAxis;
  private yTicksAxis;
  private yLabelsAxis;
  private isWidthFixed = false;
  private isHeightFixed = false;
  private isSwimlaneHeightFixed = false;
  private swimlaneHasMoreThanTwoBuckets = false;

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
  private swimlaneMaxValue: number = null;
  private swimlaneIntervalBorders: [number | Date, number | Date];
  private swimlaneDataDomain: Array<HistogramData> = new Array<HistogramData>();
  private labelsContext;
  public selectionListIntervalId: string[] = [];
  public intervalSelectedMap: Map<string, { values: SelectedOutputValues, x_position: number }> =
  new Map<string, { values: SelectedOutputValues, x_position: number }>();

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {
    Observable.fromEvent(window, 'resize')
      .debounceTime(500)
      .subscribe((event: Event) => {
        this.resizeHistogram(event);
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.histogramNode = this.viewContainerRef.element.nativeElement;

    if (changes.data && this.data !== undefined) {
      this.plotHistogram(this.data);
    }

    if (changes.intervalSelection && this.intervalSelection !== undefined) {
      if ((this.chartType !== ChartType.swimlane && (<Array<{ key: number, value: number }>>this.data).length > 0)
        || (this.chartType === ChartType.swimlane && this.swimlaneDataDomain.length > 0)
      ) {
        this.setSelectedInterval(this.intervalSelection);
      }
      this.fromSetInterval = false;
    }

    if (changes.intervalListSelection) {
      const chartAxes = (this.chartType === ChartType.swimlane) ? this.swimlaneAxes : this.chartAxes;
      if (changes.intervalListSelection.currentValue) {
        this.selectedBars.clear();
        let lastKey;
        const keys = [];
        this.selectionListIntervalId = [];
        this.intervalSelectedMap.clear();
        changes.intervalListSelection.currentValue.forEach(v => {
          (this.barsContext).filter(d => {
            d.key = +d.key;
            return d.key >= v.startvalue
              && d.key + this.barWeight * this.dataInterval <= v.endvalue;
          }).data().map(d => { this.selectedBars.add(d.key); keys.push(d.key); });
          lastKey = keys.sort((a, b) => { if (a > b) { return a; } })[keys.length - 1];
          let guid;
          if ((typeof (<Date>v.startvalue).getMonth === 'function')) {
            guid = (<Date>v.startvalue).getTime().toString() + (<Date>v.endvalue).getTime().toString();
          } else {
            guid = v.startvalue.toString() + v.endvalue.toString();
          }
          this.intervalSelectedMap.set(guid,
            {
              values: { startvalue: v.startvalue, endvalue: v.endvalue },
              x_position: chartAxes.xDomain(lastKey) + this.margin.left
            });
          if (this.selectionListIntervalId.indexOf(guid) < 0) {
            this.selectionListIntervalId.push(guid);
          }
        });
        this.intervalSelectedMap.forEach((k, v) => {
          const keys = [];
          let lastKey;
          (this.barsContext).filter((d) => {
            d.key = +d.key;
            return d.key >= k.values.startvalue
              && d.key + this.barWeight * this.dataInterval <= k.values.endvalue;
          }).data().map((d) => { this.selectedBars.add(d.key); keys.push(d.key); });
          lastKey = keys.sort((a, b) => { if (a > b) { return a; } })[keys.length - 1];
          this.intervalSelectedMap.set(v, {
            values: { startvalue: k.values.startvalue, endvalue: k.values.endvalue },
            x_position: chartAxes.xDomain(lastKey) + this.margin.left
          });
        });
        if (this.barsContext !== undefined) {
          this.applyStyleOnSelectedBars(this.barsContext);
          this.applyStyleOnSelectedSwimlanes();
        }
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
    // Truncate swimlanes labels if they exceed the swimLaneLabelsWidth
    if (this.chartType === ChartType.swimlane && this.labelsContext !== undefined) {
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
      this.addSelectionBrush(this.chartAxes);
      this.plottingCount++;
    } else {
      this.startValue = '';
      this.endValue = '';
      this.dataLength = 0;
    }
  }

  public plotHistogramSwimlane(inputData: Map<string, Array<{ key: number, value: number }>>) {
    let swimlanesMapData: Map<string, Array<HistogramData>> = null;
    if (inputData !== null && inputData.size > 0) {
      this.setSwimlaneMaxValue(inputData);
      swimlanesMapData = this.parseSwimlaneDataKey(<Map<string, Array<{ key: number, value: number }>>>inputData);
      this.nbSwimlanes = swimlanesMapData.size;
      this.setSwimlaneMinMaxValues(swimlanesMapData);
      this.initializeDescriptionValues(this.swimlaneIntervalBorders[0], this.swimlaneIntervalBorders[1]);
      this.chartDimensions = this.initializeChartDimensions();
      this.swimlaneAxes = this.createSwimlaneAxes(this.chartDimensions, swimlanesMapData);
      this.drawChartAxes(this.chartDimensions, this.swimlaneAxes);
      this.addLabels(swimlanesMapData);
      this.plotHistogramDataAsSwimlane(swimlanesMapData);
      this.showTooltipsForSwimlane(swimlanesMapData);
      this.addSelectionBrush(this.swimlaneAxes);
      this.plottingCount++;
    } else {
      this.startValue = '';
      this.endValue = '';
      this.dataLength = 0;
    }
  }

  public plotHistogram(inputData: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>): void {
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
  }

  public resizeHistogram(e: Event): void {
    if (this.isWidthFixed === false) {
      this.chartWidth = this.el.nativeElement.childNodes[0].offsetWidth;
    }

    if (this.isHeightFixed === false) {
      if (this.isSwimlaneHeightFixed === false) {
        this.chartHeight = this.el.nativeElement.childNodes[0].offsetHeight;
      } else {
        this.nbSwimlanes = (<Map<string, Array<{ key: number, value: number }>>>this.inputData).size;
        this.chartHeight = this.swimlaneHeight * this.nbSwimlanes + this.margin.top + this.margin.bottom;
      }
    }

    if (this.isSwimlaneHeightFixed === false) {
      this.swimlaneHeight = Math.max(+this.chartHeight - this.margin.top - this.margin.bottom, 0) / this.nbSwimlanes;
    }

    this.plotHistogram(this.inputData);
    if (this.chartType === ChartType.bars) {
      this.applyStyleOnSelectedBars(this.barsContext);
    }
    if (this.chartType === ChartType.swimlane) {
      this.applyStyleOnSelectedSwimlanes();
    }
    const chartAxes = (this.chartType === ChartType.swimlane) ? this.swimlaneAxes : this.chartAxes;
    this.intervalSelectedMap.forEach((k, v) => {
      const keys = [];
      let lastKey;
      (this.barsContext).filter(d => {
        d.key = +d.key;
        return d.key >= k.values.startvalue
          && d.key + this.barWeight * this.dataInterval <= k.values.endvalue;
      }).data().map(d => { this.selectedBars.add(d.key); keys.push(d.key); });
      lastKey = keys.sort((a, b) => { if (a > b) { return a; } })[keys.length - 1];
      this.intervalSelectedMap.set(v,
        {
          values: { startvalue: k.values.startvalue, endvalue: k.values.endvalue },
          x_position: chartAxes.xDomain(lastKey) + this.margin.left
        });
    });
  }

  public removeSelectInterval(id: string) {
    this.tooltip.isShown = false;
    const index = this.selectionListIntervalId.indexOf(id, 0);
    if (index > -1) {
      this.selectionListIntervalId.splice(index, 1);
    }
    this.intervalSelectedMap.delete(id);
    const selectionListInterval = [];
    this.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
    this.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));
  }

  public overRemove(e) {
    if (e.path[1].offsetTop !== undefined && e.clientX !== undefined) {
      this.tooltip.isRightSide = true;
      const dx = (this.chartDimensions.width) - 2 * e.clientX + 25;
      this.tooltip.xContent = 'Remove this';
      this.tooltip.yContent = 'period';
      this.tooltip.isShown = true;
      this.tooltip.xPosition = (e.clientX + dx);
      this.tooltip.yPosition = (e.path[1].offsetTop + 30);
    }
  }

  public leaveRemove() {
    this.tooltip.isShown = false;
  }

  private setSwimlaneMinMaxValues(swimlanesMapData: Map<string, Array<HistogramData>>) {
    const firstKey = swimlanesMapData.keys().next().value;
    const firstArrayLength = swimlanesMapData.get(firstKey).length;
    let minInterval = swimlanesMapData.get(firstKey)[0].key;
    let maxInterval = swimlanesMapData.get(firstKey)[firstArrayLength - 1].key;
    swimlanesMapData.forEach((swimlane, key) => {
      if (swimlane[0].key <= minInterval) {
        minInterval = swimlane[0].key;
      }
      if (swimlane[swimlane.length - 1].key >= maxInterval) {
        maxInterval = swimlane[swimlane.length - 1].key;
      }
    });
    this.swimlaneIntervalBorders = [minInterval, maxInterval];
  }

  private addLabels(swimlanesMapData: Map<string, Array<HistogramData>>) {
    this.labelsContext = this.context.append('g').classed('foreignObject', true);
    let i = 0;
    swimlanesMapData.forEach((swimlane, key) => {
      this.labelsContext.append('text')
        .text(() => key)
        .attr('transform', 'translate(0,' + this.swimlaneHeight * (i + 0.6) + ')');
      i++;
    });
  }

  private addSelectionBrush(chartAxes: ChartAxes | SwimlaneAxes): void {
    this.selectionBrush = d3.brushX().extent([[chartAxes.stepWidth * this.yDimension, 0],
    [(this.chartDimensions).width - this.swimLaneLabelsWidth * this.swimlaneDimension, (this.chartDimensions).height]]);
    const selectionBrushStart = Math.max(0, chartAxes.xDomain(this.selectionInterval.startvalue));
    const selectionBrushEnd = Math.min(chartAxes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
    this.verticalTooltipLine = this.context.append('g').append('line').attr('class', 'histogram__swimlane--vertical-tooltip-line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', this.chartDimensions.height)
      .style('display', 'none');
    const brush = this.context.append('g')
      .attr('class', 'brush')
      .attr('transform', 'translate(' + this.swimLaneLabelsWidth * this.swimlaneDimension + ', 0)')
      .style('visibility', 'visible')
      .style('pointer-events', 'visible')
      .call(this.selectionBrush);

    this.handleStartOfBrushingEvent(chartAxes);

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
        let lastKey;
        const keys = [];
        if (this.multiselectable) {
          (this.barsContext).filter((d) => {
            d.key = +d.key;
            return d.key >= this.selectionInterval.startvalue
              && d.key + this.barWeight * this.dataInterval <= this.selectionInterval.endvalue;
          }).data().map(d => { this.selectedBars.add(d.key); keys.push(d.key); });
          lastKey = keys.sort((a, b) => { if (a > b) { return a; } })[keys.length - 1];
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
          this.intervalSelectedMap.set(guid,
            {
              values: { startvalue: this.selectionInterval.startvalue, endvalue: this.selectionInterval.endvalue },
              x_position: chartAxes.xDomain(lastKey) + this.margin.left
            });
          if (this.selectionListIntervalId.indexOf(guid) < 0) {
            this.selectionListIntervalId.push(guid);
          }

          const selectionListInterval = [];
          this.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
        }
      });
    }
    this.handleOnBrushingEvent(chartAxes);
    this.handleEndOfBrushingEvent(chartAxes);
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
      const data = (this.chartType !== ChartType.swimlane) ? this.inputData : this.swimlaneDataDomain;
      if (data !== null) {
        if (this.isSelectionBeyondDataDomain(selectedInputValues, <Array<{ key: number, value: number }>>data)) {
          this.plotHistogram(this.inputData);
          this.hasSelectionExceededData = true;
        } else {
          if (this.hasSelectionExceededData) {
            this.plotHistogram(this.inputData);
            this.hasSelectionExceededData = false;
          }
          const chartAxes = (this.chartType === ChartType.swimlane) ? this.swimlaneAxes : this.chartAxes;
          const selectionBrushStart = Math.max(0, chartAxes.xDomain(this.selectionInterval.startvalue));
          const selectionBrushEnd = Math.min(chartAxes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
          if (this.context) {
            this.context.select('.brush').call(this.selectionBrush.move, [selectionBrushStart, selectionBrushEnd]);
          }
        }
      }
    }
  }

  private isSelectionBeyondDataDomain(selectedInputValues: SelectedInputValues, inputData: Array<{ key: number, value: number }>): boolean {
    if ((<Array<{ key: number, value: number }>>this.inputData).length !== 0) {
      return +selectedInputValues.startvalue < inputData[0].key || +selectedInputValues.endvalue > inputData[inputData.length - 1].key;
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
    switch (this.chartType) {
      case ChartType.swimlane: {
        if (this.swimlaneHeight === null) {
          this.initializeChartHeight();
          this.swimlaneHeight = Math.max(+this.chartHeight - this.margin.top - this.margin.bottom, 0) / this.nbSwimlanes;
        } else if (this.swimlaneHeight !== null && this.plottingCount === 0) {
          this.isSwimlaneHeightFixed = true;
          this.chartHeight = this.swimlaneHeight * this.nbSwimlanes + this.margin.top + this.margin.bottom;
        } else if (this.swimlaneHeight !== null && this.plottingCount !== 0) {
          if (this.isHeightFixed) {
            this.swimlaneHeight = Math.max(+this.chartHeight - this.margin.top - this.margin.bottom, 0) / this.nbSwimlanes;
          } else {
            this.chartHeight = this.swimlaneHeight * this.nbSwimlanes + this.margin.top + this.margin.bottom;
          }
        }
        break;
      }
      default: {
        this.initializeChartHeight();
        break;
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


  private initializeChartHeight() {
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
      xDataDomain.domain(data.map((d) => d.key));

      if (this.dataType === DataType.numeric) {
        xTicksAxis = d3.axisBottom(xDomain).tickPadding(5).tickValues(xDataDomain.domain()
          .filter((d, i) => !(i % ticksPeriod))).tickSize(this.minusSign * 5);
        xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).tickValues(xDataDomain.domain()
          .filter((d, i) => !(i % labelsPeriod)));
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

  private createSwimlaneAxes(chartDimensions: ChartDimensions, data: Map<string, Array<HistogramData>>): SwimlaneAxes {
    const xDomain = (this.getXDomainScale()).range([0, chartDimensions.width - this.swimLaneLabelsWidth]);
    const swimlaneInterval = this.getSwimlaneInterval(data);
    let bucketKey = +this.swimlaneIntervalBorders[0];
    const swimlaneArray = new Array<any>();
    while (bucketKey <= (+this.swimlaneIntervalBorders[1])) {
      swimlaneArray.push({ key: bucketKey, value: 0 });
      bucketKey = bucketKey + swimlaneInterval;
    }
    this.swimlaneDataDomain = swimlaneArray;
    // The xDomain extent includes data domain and selected values
    const xDomainExtent = this.getXDomainExtent(this.swimlaneDataDomain,
      this.selectionInterval.startvalue, this.selectionInterval.endvalue, swimlaneInterval);
    xDomain.domain(xDomainExtent);
    // xDataDomain includes data domain only
    const xDataDomainArray = [];
    let xAxis;
    let xTicksAxis;
    let xLabelsAxis;
    let stepWidth;
    // Compute the range (in pixels) of xDataDomain where data will be plotted
    const ticksPeriod = Math.max(1, Math.round(this.swimlaneDataDomain.length / this.xTicks));
    const labelsPeriod = Math.max(1, Math.round(this.swimlaneDataDomain.length / this.xLabels));
    const startAllDataRange = xDomain(this.swimlaneDataDomain[0].key);
    const endAllDataRange = xDomain(+this.swimlaneDataDomain[this.swimlaneDataDomain.length - 1].key + swimlaneInterval);

    const xAllDataDomain = d3.scaleBand().range([startAllDataRange, endAllDataRange]).paddingInner(0);
    xAllDataDomain.domain(this.swimlaneDataDomain.map((d) => (d.key).toString()));
    if (this.dataType === DataType.numeric) {
      xTicksAxis = d3.axisBottom(xDomain).tickPadding(5).tickValues(xAllDataDomain.domain()
        .filter((d, i) => !(i % ticksPeriod))).tickSize(this.minusSign * 5);
      xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).tickValues(xAllDataDomain.domain()
        .filter((d, i) => !(i % labelsPeriod)));
    } else {
      xTicksAxis = d3.axisBottom(xDomain).ticks(this.xTicks).tickSize(this.minusSign * 5);
      xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).ticks(this.xLabels);
    }
    xAxis = d3.axisBottom(xDomain).tickSize(0);

    data.forEach(swimlane => {
      const startRange = xDomain(swimlane[0].key);
      let endRange;
      let xDataDomain;
      stepWidth = xDomain(+swimlane[0].key + swimlaneInterval) - xDomain(+swimlane[0].key);
      endRange = xDomain(+swimlane[swimlane.length - 1].key + this.dataInterval);
      xDataDomain = d3.scaleBand().range([startRange, endRange]).paddingInner(0);
      xDataDomain.domain(swimlane.map((d) => d.key));
      xDataDomainArray.push(xDataDomain);
    });
    return { xDomain, xDataDomainArray, xTicksAxis, stepWidth, xLabelsAxis, xAxis };
  }



  // draw three axes for X and two for Y
  // For X: - The first axis contains a line only that is always at the bottom of the chart
  //        - The second one contains a line and ticks. Labels are always hidden.
  //        - For the third one, only labels are shown.
  // For Y: - The first axis contains a line and ticks. Labels are always hidden.
  //        - For the second one, only labels are shown.
  private drawChartAxes(chartDimensions: ChartDimensions, chartAxes: ChartAxes | SwimlaneAxes): void {
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
    if (this.chartType === ChartType.swimlane) {
      this.drawLineSeparators(allAxesContext);
    }
    if (this.chartType !== ChartType.oneDimension && this.chartType !== ChartType.swimlane) {
      this.yTicksAxis = allAxesContext.append('g')
        .attr('class', 'histogram__ticks-axis')
        .call((<ChartAxes>chartAxes).yTicksAxis);
      this.yLabelsAxis = allAxesContext.append('g')
        .attr('class', 'histogram__labels-axis')
        .call((<ChartAxes>chartAxes).yLabelsAxis);
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
      this.xTicksAxis.call(chartAxes.xTicksAxis.tickSize(-this.minusSign * chartDimensions.height * this.swimlaneDimension));
    }
  }

  private drawLineSeparators(allAxesContext): void {
    for (let i = 0; i <= (<Map<string, Array<{ key: number, value: number }>>>this.inputData).size; i++) {
      allAxesContext.append('g')
        .attr('class', 'histogram__line-separator')
        .attr('transform', 'translate(' + this.swimlaneDimension * this.swimLaneLabelsWidth + ',' + this.swimlaneHeight * i + ')')
        .call(this.swimlaneAxes.xAxis);
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
    data: Array<HistogramData>, barHeight: number, barWeight: number, dataMaxValue: number): any {
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

  private plotHistogramDataAsOneLane(data: Array<HistogramData>, barHeight: number, barWeight: number, index: number): any {
    return this.barsContext = this.context.append('g').attr('class', 'histogram__onelane-data')
      .selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('x', (d) => this.swimlaneAxes.xDataDomainArray[index](d.key))
      .attr('width', this.swimlaneAxes.stepWidth * barWeight)
      .attr('height', function (d) { return barHeight; })
      .style('fill', (d) => this.getColor(d.value / this.swimlaneMaxValue).toHexString())
      .style('stroke', (d) => this.getColor(d.value / this.swimlaneMaxValue).toHexString())
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

  private plotHistogramDataAsCircles(data: Array<HistogramData>, swimlaneHeight: number, indexOfSwimlane: number) {
    return this.barsContext = this.context.append('g')
      .attr('class', 'histogram__swimlane').selectAll('dot').data(data).enter().append('circle')
      .attr('r', (d) => Math.min(this.swimlaneAxes.stepWidth, swimlaneHeight) * this.barWeight *
        Math.sqrt(d.value / this.swimlaneMaxValue) / 2)
      .attr('cx', (d) => this.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[indexOfSwimlane](d.key) +
        this.swimlaneAxes.stepWidth * this.barWeight / 2)
      .attr('cy', (d) => swimlaneHeight * (indexOfSwimlane + 1) - swimlaneHeight / 2)
      .attr('class', 'histogram__swimlane--circle')
      .style('fill', (d) => this.getColor(d.value / this.swimlaneMaxValue).toHexString())
      .style('stroke', (d) => this.getColor(d.value / this.swimlaneMaxValue).toHexString())
      .style('opacity', '0.8');
  }

  private plotHistogramDataAsSwimlane(swimlaneData: Map<string, Array<HistogramData>>): void {
    const keys = swimlaneData.keys();
    for (let i = 0; i < swimlaneData.size; i++) {
      const key = keys.next().value;
      if (this.swimlaneMode === SwimlaneMode.circles) {
        this.plotHistogramDataAsCircles(swimlaneData.get(key), this.swimlaneHeight, i);
      } else {
        this.plotHistogramDataAsOneLane(swimlaneData.get(key), this.swimlaneHeight, this.barWeight, i)
          .attr('rx', this.swimlaneBorderRadius)
          .attr('ry', this.swimlaneBorderRadius)
          .attr('y', this.swimlaneHeight * (i))
          .attr('height', (d) => this.getSwimlaneContentHeight(d.value, this.swimlaneMaxValue))
          .attr('transform', (d) => 'translate(' + this.swimLaneLabelsWidth + ',' + this.getSwimlaneVerticalTranslation(d.value, i) + ')');
      }
      this.swimlaneContextList.push(this.barsContext);
      if (this.swimlaneMode === SwimlaneMode.fixedHeight) {
        this.plotHorizontalTicksForSwimlane(swimlaneData.get(key), this.barWeight, this.swimlaneMaxValue, i);
      }
    }
  }

  private getSwimlaneContentHeight(swimlaneValue?: number, swimlaneMaxValue?: number): number {
    return (this.swimlaneMode === SwimlaneMode.fixedHeight) ? this.swimlaneHeight - 5 :
      swimlaneValue * this.swimlaneHeight / swimlaneMaxValue;
  }

  private getSwimlaneVerticalTranslation(swimlaneValue?: number, indexOfSwimlane?: number): number {
    return (this.swimlaneMode === SwimlaneMode.fixedHeight) ? 5 :
      this.swimlaneHeight - swimlaneValue * this.swimlaneHeight / this.swimlaneMaxValue;
  }

  private plotHorizontalTicksForSwimlane(data: Array<HistogramData>, barWeight: number, dataMaxValue, index) {
    this.context.append('g').attr('class', 'histogram__swimlane-height')
      .selectAll('path')
      .data(data)
      .enter().append('line').attr('class', 'histogram__swimlane-height--tick')
      .attr('x1', (d) => this.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[index](d.key))
      .attr('y1', (d) => this.swimlaneHeight * (index + 1) - (+d.value) * this.swimlaneHeight / (+dataMaxValue))
      .attr('x2', (d) => this.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[index](d.key) +
        this.swimlaneAxes.stepWidth * barWeight)
      .attr('y2', (d) => this.swimlaneHeight * (index + 1) - (+d.value) * this.swimlaneHeight / (+dataMaxValue));
  }

  private showTooltips(data: Array<HistogramData>): void {
    if (this.dataUnit !== '') {
      this.dataUnit = '(' + this.dataUnit + ')';
    }
    this.context
      .on('mousemove', () => this.setTooltipPosition(data, <d3.ContainerElement>this.context.node()))
      .on('mouseout', () => this.tooltip.isShown = false);
  }

  private showTooltipsForSwimlane(swimlaneMapData: Map<string, Array<HistogramData>>): void {
    this.swimlaneXTooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
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
          const hiddenTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
          this.swimlaneXTooltip.isShown = false;
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
          break;
        }
        case ChartType.area: {
          startPosition = this.chartAxes.xDomain(data[i].key) - 10;
          endPosition = this.chartAxes.xDomain(data[i].key) + 10;
          break;
        }
        default: break;
      }
      if (xy[0] >= startPosition && xy[0] < endPosition && !this.isBrushing) {
        if (data[i].key >= this.selectionInterval.startvalue
          && data[i].key <= this.selectionInterval.endvalue) {
          if (xy[1] < this.chartAxes.yDomain(data[i].value) && this.multiselectable) {
            this.tooltip.isShown = true;
            dx = this.setTooltipXposition(xy[0], this.tooltip);
            dy = this.setTooltipYposition(xy[1]);
            this.tooltip.xContent = 'Double click';
            this.tooltip.yContent = 'to save this period';

          } else {
            this.tooltip.isShown = true;
            dx = this.setTooltipXposition(xy[0], this.tooltip);
            dy = this.setTooltipYposition(xy[1]);
            this.tooltip.xContent = this.toString(data[i].key);
            this.tooltip.yContent = data[i].value.toString();
          }

        } else {
          this.tooltip.isShown = true;
          dx = this.setTooltipXposition(xy[0], this.tooltip);
          dy = this.setTooltipYposition(xy[1]);
          this.tooltip.xContent = this.toString(data[i].key);
          this.tooltip.yContent = data[i].value.toString();
        }
        break;
      } else {
        if (data[i].key >= this.selectionInterval.startvalue
          && data[i].key <= this.selectionInterval.endvalue && this.multiselectable) {
          this.tooltip.isShown = true;
          dx = this.setTooltipXposition(xy[0], this.tooltip);
          dy = this.setTooltipYposition(xy[1]);
          this.tooltip.xContent = 'Double click';
          this.tooltip.yContent = 'to save this period';
        } else {
          this.tooltip.isShown = false;

        }
      }
    }
    this.tooltip.xPosition = (xy[0] + dx);
    this.tooltip.yPosition = (xy[1] + dy);
  }

  private setTooltipPositionForSwimlane(data: Array<HistogramData>, key: string, indexOfKey: number, numberOfSwimlane: number,
    container: d3.ContainerElement): void {
    const xy = d3.mouse(container);
    let dx, dy, startPosition, endPosition, middlePosition;
    const tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
    for (let i = 0; i < data.length; i++) {
      startPosition = this.swimLaneLabelsWidth * this.swimlaneDimension + this.swimlaneAxes.xDomain(data[i].key);
      endPosition = startPosition + this.swimlaneAxes.stepWidth * this.barWeight;
      middlePosition = startPosition + this.swimlaneAxes.stepWidth * this.barWeight / 2;

      if (xy[0] >= startPosition && xy[0] < endPosition && !this.isBrushing) {
        this.verticalTooltipLine.style('display', 'block').attr('transform', 'translate(' + middlePosition + ',' + '0)');
        tooltip.isShown = true;
        dx = this.setTooltipXposition(xy[0], tooltip);
        dy = this.setTooltipYposition(xy[1]);
        tooltip.xPosition = (xy[0] + dx);
        tooltip.yPosition = this.swimlaneHeight * (indexOfKey + 0.2);
        tooltip.xContent = this.toString(data[i].key);
        tooltip.yContent = data[i].value.toString();
        this.swimlaneXTooltip = tooltip;
        this.swimlaneTooltipsMap.set(key, tooltip);
        break;
      } else {
        if (this.isBrushing) {
          this.verticalTooltipLine.style('display', 'none');
        }
        const hiddenTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
        this.swimlaneTooltipsMap.set(key, hiddenTooltip);
      }
    }
  }

  private setTooltipXposition(xPosition: number, tooltip: Tooltip): number {
    let dx;
    if (xPosition > (this.chartDimensions.width - (this.swimlaneDimension * this.swimLaneLabelsWidth)) / 2) {
      tooltip.isRightSide = true;
      dx = (this.chartDimensions.width) - 2 * xPosition + 25;
    } else {
      tooltip.isRightSide = false;
      switch (this.chartType) {
        case ChartType.swimlane: {
          dx = 25;
          break;
        }
        case ChartType.oneDimension:
          {
            tooltip.isShown = false;
            dx = 30;
            break;
          }
        case ChartType.bars:
        case ChartType.area: {
          dx = 80;
          break;
        }
        default: break;
      }
    }
    return dx;
  }

  private setTooltipYposition(yPosition: number): number {
    let dy;
    switch (this.chartType) {
      case ChartType.bars: {
        dy = (this.minusSign === 1) ? -10 : 20;
        break;
      }
      case ChartType.area: {
        dy = -10;
        break;
      }
      default: {
        dy = 0;
        break;
      }
    }
    return dy;
  }

  private translateBrushHandles(selection: any, chartAxes: ChartAxes | SwimlaneAxes) {
    const xTranslation = this.brushHandlesHeight - (this.chartDimensions.height - this.brushHandlesHeight) / 2;
    if (selection !== null) {
      const sx = selection.map(chartAxes.xDomain.invert);
      this.brushHandles.attr('display', null).attr('transform', function (d, i) {
        return 'translate(' + [selection[i], -xTranslation] + ')';
      });

    } else {
      this.brushHandles.attr('display', 'none');
    }
  }

  private handleStartOfBrushingEvent(chartAxes: ChartAxes | SwimlaneAxes): void {
    if (this.brushHandlesHeightWeight <= 1 && this.brushHandlesHeightWeight > 0) {
      this.brushHandlesHeight = this.chartDimensions.height * this.brushHandlesHeightWeight;
    } else {
      this.brushHandlesHeight = this.chartDimensions.height;
    }
    this.selectionBrush.on('start', () => {
      const selection = d3.event.selection;
      this.translateBrushHandles(selection, chartAxes);
    });
  }

  private handleOnBrushingEvent(chartAxes: ChartAxes | SwimlaneAxes): void {
    this.selectionBrush.on('brush', (datum: any, index: number) => {
      this.isBrushing = true;
      const selection = d3.event.selection;
      if (selection !== null) {
        this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
        this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
        this.startValue = 'From ' + this.toString(this.selectionInterval.startvalue);
        this.endValue = ' to ' + this.toString(this.selectionInterval.endvalue);
        this.showTitle = false;
        if (this.chartType === ChartType.bars) {
          this.applyStyleOnSelectedBars(this.barsContext);
        }
        if (this.chartType === ChartType.swimlane) {
          this.applyStyleOnSelectedSwimlanes();
        }
        this.translateBrushHandles(selection, chartAxes);
      }
    });
  }

  private handleEndOfBrushingEvent(chartAxes: ChartAxes | SwimlaneAxes): void {
    this.selectionBrush.on('end', (datum: any, index: number) => {
      const selection = d3.event.selection;
      if (selection !== null) {
        const newStartValue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
        const newEndvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
        if ((!this.fromSetInterval) && this.isBrushing) {
          this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
          this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
          this.startValue = this.toString(this.selectionInterval.startvalue);
          this.endValue = this.toString(this.selectionInterval.endvalue);
          const selectionListInterval = [];
          this.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
          this.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));
          const data = (this.chartType !== ChartType.swimlane) ? this.inputData : this.swimlaneDataDomain;
          if (!this.isSelectionBeyondDataDomain(this.selectionInterval, <Array<{ key: number, value: number }>>data)) {
            this.plotHistogram(this.inputData);
          }

        }
        this.showTitle = true;
        this.isBrushing = false;
      } else {
        this.translateBrushHandles(null, chartAxes);
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
      if (this.chartType === ChartType.oneDimension) {
        return Math.trunc(value).toString();
      } else {
        if (this.dataType === DataType.time) {
          const date = new Date(this.round(value, 1));
          return date.toDateString();

        } else {
          return this.round(value, 1).toString();

        }
      }
    }
  }

  private parseDataKey(inputData: Array<{ key: number, value: number }>): Array<HistogramData> {
    if (this.chartType !== ChartType.swimlane) {
      this.dataLength = inputData.length;
    }
    return (this.dataType === DataType.time) ? this.parseDataKeyToDate(inputData) : inputData;
  }

  /**
   * each swimlane is has a key which is a string and a value which is a key-value array as for a single simple chart
   */
  private parseSwimlaneDataKey(swimlanesInputData: Map<string, Array<{ key: number, value: number }>>):
    Map<string, Array<HistogramData>> {
    const swimlaneParsedDataMap = new Map<string, Array<HistogramData>>();
    swimlanesInputData.forEach((swimlane, key) => {
      if (swimlane !== null && Array.isArray(swimlane) && swimlane.length > 0) {
        swimlaneParsedDataMap.set(key, this.parseDataKey(swimlane));
      }
    });
    return swimlaneParsedDataMap;
  }

  private parseDataKeyToDate(inputData: Array<{ key: number, value: number }>, lane?: string) {
    const parsedData = new Array<HistogramData>();
    const multiplier = (this.dateUnit === DateUnit.second) ? 1000 : 1;
    inputData.forEach(d => {
      parsedData.push({ key: new Date(d.key * multiplier), value: d.value });
    });
    return parsedData;
  }

  private parseDataKeyToDateWithoutMultiplier(inputData: Array<{ key: number, value: number }>) {
    const parsedData = new Array<HistogramData>();
    inputData.forEach(d => {
      parsedData.push({ key: new Date(d.key), value: d.value });
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


  private setSwimlaneMaxValue(swimlaneDataMap: Map<string, Array<{ key: number, value: number }>>) {
    this.swimlaneMaxValue = null;
    swimlaneDataMap.forEach((swimlane, key) => {
      if (this.swimlaneMaxValue === null) {
        this.swimlaneMaxValue = swimlane[0].value;
      } else {
        swimlane.forEach(element => {
          if (element.value > this.swimlaneMaxValue) {
            this.swimlaneMaxValue = element.value;
          }
        });
      }
    });
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
    selectedEndValue: Date | number, interval?: number): Array<Date | number | { valueOf(): number }> {
    this.dataInterval = 0;
    if (this.chartType !== ChartType.area && this.chartType !== ChartType.swimlane) {
      this.dataInterval = this.getBucketInterval(data, selectedStartValue, selectedEndValue);
    } else if (this.chartType === ChartType.swimlane) {
      this.dataInterval = interval;
    }

    const xDomainExtent = new Array<Date | number | { valueOf(): number }>();
    const dataKeyUnionSelectedValues = new Array<Date | number>();
    data.forEach(d => {
      dataKeyUnionSelectedValues.push(d.key);
    });

    dataKeyUnionSelectedValues.push(selectedStartValue);
    dataKeyUnionSelectedValues.push(selectedEndValue);
    if (this.dataType === DataType.time) {
      xDomainExtent.push(new Date(d3.min(dataKeyUnionSelectedValues, (d: Date) => +d) - this.dataInterval));
      xDomainExtent.push(new Date(d3.max(dataKeyUnionSelectedValues, (d: Date) => +d) + this.dataInterval));
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
          interval = Math.min(interval, +data[i + 1].key - +data[i].key);
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

  private getSwimlaneInterval(swimlaneData: Map<string, Array<HistogramData>>): number {
    const keys = swimlaneData.keys();
    for (let i = 0; i < swimlaneData.size; i++) {
      const key = keys.next().value;
      if (swimlaneData.get(key).length > 1) {
        this.swimlaneHasMoreThanTwoBuckets = true;
        this.dataLength = swimlaneData.get(key).length;
        this.displaySvg = 'block';
        return (+swimlaneData.get(key)[1].key - +swimlaneData.get(key)[0].key);
      }
    }
    if (!this.swimlaneHasMoreThanTwoBuckets) {
      this.dataLength = 3;
      this.displaySvg = 'block';
      // all the lanes has 1 bucket maximum
      let previousKeyPosition = null;
      let currentKeyPosition = null;
      let interval = Number.MAX_VALUE;
      swimlaneData.forEach((swimlane, key) => {
        previousKeyPosition = currentKeyPosition;
        currentKeyPosition = +swimlane[0].key;
        if (previousKeyPosition !== null && previousKeyPosition !== currentKeyPosition) {
          interval = Math.max(0, Math.min(interval, Math.abs(currentKeyPosition - previousKeyPosition)));
        }
      });
      return (interval === 0 || interval === Number.MAX_VALUE) ? 1 : interval;
    }
  }
}
