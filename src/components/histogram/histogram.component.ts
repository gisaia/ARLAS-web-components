import {
  Component, OnInit, Input, Output, ViewEncapsulation,
  ViewContainerRef, ElementRef, OnChanges, SimpleChanges, AfterViewChecked, ViewChild
} from '@angular/core';

import {
  ChartType, DataType, SelectedInputValues, SelectedOutputValues, Position, SwimlaneMode,
  HistogramUtils
} from 'arlas-d3';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';

import { HistogramParams, AbstractHistogram, ChartArea, ChartBars, ChartOneDimension, SwimlaneCircles, SwimlaneBars
  , AbstractSwimlane  } from 'arlas-d3';

import * as histogramJsonSchema from './histogram.schema.json';
import * as swimlaneJsonSchema from './swimlane.schema.json';
import { AbstractChart } from 'arlas-d3/histograms/charts/AbstractChart';

/**
 * The Histogram web component allows you to display your numeric and temporal data in charts or swimlanes.
 * Charts can be represented as bars or areas.
 * Swimlanes can be represented as bars or circles.
 * For both modes, data can be multi-selected using a selection brush.
 */

@Component({
  selector: 'arlas-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HistogramComponent implements OnInit, OnChanges, AfterViewChecked {

  @ViewChild('left', {read: ElementRef}) public lt: ElementRef;
  @ViewChild('right', {read: ElementRef}) public rt: ElementRef;

  /**
   * @Input : Angular
   * @description Data to plot in the chart.
   */
  @Input() public data: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>;
  /**
   * @Input
   * @description To be set to `time` when x axis represents dates and to `numeric` otherwise.
   */
  @Input() public dataType: DataType = DataType.numeric;
  /**
   * @description Unity of data to add in the end of tooltip values.
   */
  @Input() public dataUnit = '';
  /**
   * @Input : Angular
   * @description The date format of the start/end values.
   *  Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
   */
  @Input() public valuesDateFormat: string = null;
  /**
   * @Input : Angular
   * @description Whether the chart is selectable.
   */
  @Input() public isHistogramSelectable = true;
  /**
   * @Input : Angular
   * @description Whether the selection is multiple.
   */
  @Input() public multiselectable = false;
  /**
   * @Input : Angular
   * @description A single interval that selects data.
   */
  @Input() public intervalSelection: SelectedInputValues;
  /**
   * @Input : Angular
   * @description A list of intervals that select data.
   */
  @Input() public intervalListSelection: SelectedInputValues[];
  /**
   * @Input : Angular
   * @description Top position of the remove-selection-button.
   */
  @Input() public topOffsetRemoveInterval = 40;
  /**
   * @Input : Angular
   * @description leftOffsetRemoveInterval.
   */
  @Input() public leftOffsetRemoveInterval = 18;
  /**
   * @Input : Angular
   * @description A 0 to 1 weight of the brush height. It controls the brush handles height.
   */
  @Input() public brushHandlesHeightWeight = 1 / 2;
  /**
   * @Input : Angular
   * @description Chart's representation type.
   */
  @Input() public chartType: ChartType = ChartType.area;
  /**
   * @Input : Angular
   * @description Chart's title.
   */
  @Input() public chartTitle = '';
  /**
   * @Input : Angular
   * @description Chart's width. If not specified, the chart takes the component's container width.
   */
  @Input() public chartWidth: number = null;
  /**
   * @Input : Angular
   * @description Chart's height. If not specified, the chart takes the component's container height.
   */
  @Input() public chartHeight: number = null;
  /**
   * @Input : Angular
   * @description Css class name to use to customize a specific `arlas-histogram` component.
   */
  @Input() public customizedCssClass = '';
  /**
   * @Input : Angular
   * @description Whether the histogram values start from zero or from the minimum of data
   */
  @Input() public yAxisStartsFromZero = true;
  /**
   * @Input : Angular
   * @description Whether to add stripes in the histograms when yAxis starts from minimum of data
   */
  @Input() public showStripes = true;
  /**
   * @Input : Angular
   * @description The xAxis positon : above or below the chart.
   */
  @Input() public xAxisPosition: Position = Position.bottom;
  /**
   * @Input : Angular
   * @description The start/end values positon : above or below the chart.
   */
  @Input() public descriptionPosition: Position = Position.bottom;
  /**
   * @Input : Angular
   * @description Number of ticks in the X axis.
   */
  @Input() public xTicks = 5;
  /**
   * @Input : Angular
   * @description Number of ticks in the Y axis.
   */
  @Input() public yTicks = 5;
  /**
   * @Input : Angular
   * @description Number of labels in the X axis.
   */
  @Input() public xLabels = 5;
  /**
   * @Input : Angular
   * @description Number of labels in the Y axis.
   */
  @Input() public yLabels = 5;
  /**
   * @Input : Angular
   * @description Whether showing the X axis ticks.
   */
  @Input() public showXTicks = true;
  /**
   * @Input : Angular
   * @description Whether showing the Y axis ticks.
   */
  @Input() public showYTicks = true;
  /**
   * @Input : Angular
   * @description Whether showing the X axis labels.
   */
  @Input() public showXLabels = true;
  /**
   * @Input : Angular
   * @description Whether showing the Y axis labels.
   */
  @Input() public showYLabels = true;
  /**
   * @Input : Angular
   * @description Whether showing the horizontal dashed lines.
   */
  @Input() public showHorizontalLines = true;
  /**
   * @Input : Angular
   * @description The date format of ticks.
   * Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
   */
  @Input() public ticksDateFormat: string = null;
  /**
   * @Input : Angular
   * @description Whether the curve of an `area` chart is smoothed.
   */
  @Input() public isSmoothedCurve = true;

  /**
   * @Input : Angular
   * @description Weight applied to bars width. ]0,1].
   */
  @Input() public barWeight = 0.6;
  /**
   * @Input : Angular
   * @description Either a hex string color or a color name (in English) or a saturation interval.
   */
  @Input() public paletteColors: [number, number] | string = null;
   /**
   * @Input : Angular
   * @description Allows to include only selections that contain data in the histogram/swimlane
   */
  @Input() public displayOnlyIntervalsWithData = false;
  /**
   * @Input : Angular
   * @description Translates area chart by half data interval
   */
  @Input() public applyOffsetOnAreaChart = true;
  /**
   * @Input : Angular
   * @description The swimlane representation mode.
   */
  @Input() public swimlaneMode: SwimlaneMode = SwimlaneMode.variableHeight;
  /**
   * @Input : Angular
   * @description The width of swimlane labels space.
   */
  @Input() public swimLaneLabelsWidth = null;
  /**
   * @Input : Angular
   * @description The radius of swimlane bars borders.
   */
  @Input() public swimlaneBorderRadius = 3;
  /**
   * @Input : Angular
   * @description The height of a single lane. If not specified, a lane height is the chartHeight devided by the number of lanes.
   */
  @Input() public swimlaneHeight: number = null;

  @Input() public id;
  /**
   * @Input : Angular
   * @description Term's list of powerbars to select
   */
  @Input() public selectedSwimlanes = new Set<string>();
  /**
   * @Output : Angular
   * @description Emits the list of selected powerbars terms
   */
  @Output() public selectedSwimlanesEvent = new Subject<Set<string>>();
  /**
   * @Output : Angular
   * @description Emits the list of selected intervals.
   */
  @Output() public valuesListChangedEvent: Subject<SelectedOutputValues[]> = new Subject<SelectedOutputValues[]>();
  /**
   * @Output : Angular
   * @description Emits the hovered bucket key (key as in HistogramData).
   */
  @Output() public hoveredBucketEvent: Subject<Date | number> = new Subject<Date | number>();
  /**
   * @Output : Angular
   * @description Emits the hovered bucket key (key as in HistogramData).
   */
  @Output() public dataPlottedEvent: Subject<string> = new Subject<string>();

  public histogram: AbstractHistogram;
  public ChartType = ChartType;
  public Array = Array;

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {
    Observable.fromEvent(window, 'resize')
      .debounceTime(500)
      .subscribe((event: Event) => {
        this.resizeHistogram();
      });
  }

  public static getHistogramJsonSchema(): Object {
    return histogramJsonSchema;
  }

  public static getSwimlaneJsonSchema(): Object {
    return swimlaneJsonSchema;
  }


  public ngOnChanges(changes: SimpleChanges): void {

    if (this.histogram === undefined) {
      switch (this.chartType) {
        case ChartType.area: {
          this.histogram = new ChartArea();
          break;
        }
        case ChartType.bars: {
          this.histogram = new ChartBars();
          break;
        }
        case ChartType.oneDimension: {
          this.histogram = new ChartOneDimension();
          break;
        }
        case ChartType.swimlane: {
          if (this.swimlaneMode === SwimlaneMode.circles) {
            this.histogram = new SwimlaneCircles();
          } else {
            this.histogram = new SwimlaneBars();
          }
          break;
        }
        default: {
          break;
        }
      }
      this.setHistogramParameters();
    }

    if (changes.data && this.data !== undefined && this.histogram !== undefined) {
      this.histogram.histogramParams.data = this.data;
      this.histogram.histogramParams.hasDataChanged = true;
      this.plotHistogram(this.data);
      this.histogram.histogramParams.hasDataChanged = false;
      this.dataPlottedEvent.next('DATA_PLOTTED');
    }

    if (changes.intervalSelection && this.intervalSelection !== undefined && this.histogram !== undefined && this.isHistogramSelectable) {
      this.histogram.histogramParams.intervalSelection = this.intervalSelection;
      if (this.histogram.histogramParams.dataLength > 0) {
        (<AbstractChart>this.histogram).setSelectedInterval(this.intervalSelection);
      }
    }

    if (changes.intervalListSelection && this.isHistogramSelectable && this.histogram !== undefined) {
      if (changes.intervalListSelection.currentValue) {
        this.histogram.histogramParams.intervalListSelection = this.intervalListSelection;
        (<AbstractChart>this.histogram).redrawSelectedIntervals();
      }
    }

    if (changes.selectedSwimlanes && this.histogram !== undefined && this.chartType === ChartType.swimlane) {
      this.histogram.histogramParams.selectedSwimlanes = this.selectedSwimlanes;
      (<AbstractSwimlane>this.histogram).applyStyleOnSwimlanes();
    }
  }

  public ngOnInit() {

  }

  public ngAfterViewChecked() {
    if (this.chartType === ChartType.swimlane) {
      (<AbstractSwimlane>this.histogram).truncateLabels();
    }
    if (this.rt !==  undefined && this.lt !== undefined) {
      this.histogram.histogramParams.rightBrushElement = this.rt.nativeElement;
      this.histogram.histogramParams.leftBrushElement = this.lt.nativeElement;
    }
  }

  /**
   * @description Plots the histogram
   */
  public plotHistogram(inputData: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>): void {
    this.histogram.plot(inputData);
  }

  /**
   * @description Resizes the histogram on windows resize event
   */
  public resizeHistogram(): void {
    if (this.histogram) {
      this.histogram.resize(this.el.nativeElement.childNodes[0]);
    }
  }

  /**
   * @description Removes the selected interval
   */
  public removeSelectInterval(id: string) {
    (<AbstractChart>this.histogram).removeSelectInterval(id);
  }

  /**
   * @description Displays the "Remove" tooltip
   */
  public overRemove(e) {
    (<AbstractChart>this.histogram).overRemove(e);
  }

  /**
   * @description Hides the "Remove" tooltip
   */
  public leaveRemove() {
    (<AbstractChart>this.histogram).leaveRemove();
  }

  private setHistogramParameters() {
    this.histogram.histogramParams = new HistogramParams();
    this.histogram.histogramParams.barWeight = this.barWeight;
    this.histogram.histogramParams.brushHandlesHeightWeight = this.brushHandlesHeightWeight;
    this.histogram.histogramParams.chartHeight = this.chartHeight;
    this.histogram.histogramParams.chartTitle = this.chartTitle;
    this.histogram.histogramParams.chartType = this.chartType;
    this.histogram.histogramParams.chartWidth = this.chartWidth;
    this.histogram.histogramParams.data = this.data;
    this.histogram.histogramParams.dataType = this.dataType;
    this.histogram.histogramParams.dataUnit = this.dataUnit;
    this.histogram.histogramParams.hoveredBucketEvent = this.hoveredBucketEvent;
    this.histogram.histogramParams.intervalListSelection = this.intervalListSelection;
    this.histogram.histogramParams.intervalSelection = this.intervalSelection;
    this.histogram.histogramParams.isHistogramSelectable = this.isHistogramSelectable;
    this.histogram.histogramParams.isSmoothedCurve = this.isSmoothedCurve;
    this.histogram.histogramParams.multiselectable = this.multiselectable;
    this.histogram.histogramParams.paletteColors = this.paletteColors;
    this.histogram.histogramParams.showHorizontalLines = this.showHorizontalLines;
    this.histogram.histogramParams.showXLabels = this.showXLabels;
    this.histogram.histogramParams.showXTicks = this.showXTicks;
    this.histogram.histogramParams.showYLabels = this.showYLabels;
    this.histogram.histogramParams.showYTicks = this.showYTicks;
    this.histogram.histogramParams.ticksDateFormat = this.ticksDateFormat;
    this.histogram.histogramParams.topOffsetRemoveInterval = this.topOffsetRemoveInterval;
    this.histogram.histogramParams.valuesDateFormat = this.valuesDateFormat;
    this.histogram.histogramParams.valuesListChangedEvent = this.valuesListChangedEvent;
    this.histogram.histogramParams.xAxisPosition = this.xAxisPosition;
    this.histogram.histogramParams.xLabels = this.xLabels;
    this.histogram.histogramParams.xTicks = this.xTicks;
    this.histogram.histogramParams.yLabels = this.yLabels;
    this.histogram.histogramParams.yTicks = this.yTicks;
    this.histogram.histogramParams.swimLaneLabelsWidth = this.swimLaneLabelsWidth;
    this.histogram.histogramParams.swimlaneHeight = this.swimlaneHeight;
    this.histogram.histogramParams.swimlaneBorderRadius = this.swimlaneBorderRadius;
    this.histogram.histogramParams.swimlaneMode = this.swimlaneMode;
    this.histogram.histogramParams.uid = HistogramUtils.generateUID();
    this.histogram.histogramParams.id = this.id;
    this.histogram.histogramParams.histogramContainer = this.el.nativeElement.childNodes[0];
    this.histogram.histogramParams.svgNode = this.el.nativeElement.childNodes[0].querySelector('svg');
    this.histogram.histogramParams.displayOnlyIntervalsWithData = this.displayOnlyIntervalsWithData;
    this.histogram.histogramParams.yAxisFromZero = this.yAxisStartsFromZero;
    this.histogram.histogramParams.showStripes = this.showStripes;
    this.histogram.histogramParams.moveDataByHalfInterval = this.applyOffsetOnAreaChart;
    this.histogram.histogramParams.selectedSwimlanes = this.selectedSwimlanes;
    this.histogram.histogramParams.selectedSwimlanesEvent = this.selectedSwimlanesEvent;
  }
}
