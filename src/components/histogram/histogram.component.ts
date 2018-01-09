import {
  Component, OnInit, Input, Output, ViewEncapsulation,
  ViewContainerRef, ElementRef, OnChanges, SimpleChanges, AfterViewChecked
} from '@angular/core';

import { ChartType, DataType, DateUnit, SelectedInputValues, SelectedOutputValues, Position, SwimlaneMode, HistogramUtils } from './histogram.utils';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';

import { NUMBER_TYPE } from '@angular/compiler/src/output/output_ast';
import { element } from 'protractor';
import { log } from 'util';

import { HistogramParams } from './model/HistogramParams';
import { AbstractHistogram } from './model/AbstractHistogram';
import { ChartArea } from './model/charts/ChartArea';
import { AbstractChart } from './model/charts/AbstractChart';
import { ChartBars } from './model/charts/ChartBars';
import { ChartOneDimension } from './model/charts/ChartOneDimension';
import { AbstractSwimlane } from './model/swimlanes/AbstractSwimlane';
import { SwimlaneCircles } from './model/swimlanes/SwimlaneCircles';
import { SwimlaneBars } from './model/swimlanes/SwimlaneBars';

@Component({
  selector: 'arlas-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HistogramComponent implements OnInit, OnChanges, AfterViewChecked {

  /**
   * @Input
   * @description Data to plot in the chart.
   */
  @Input() public data: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>;
  /**
   * @Input
   * @description To be set to `time` when x axis represents dates and to `numeric` otherwise.
   */
  @Input() public dataType: DataType = DataType.numeric;
  /**
   * @Input
   * @description The unity of data key when it represents `time`.
   */
  @Input() public dateUnit: DateUnit = DateUnit.millisecond;
  /**
   * @description Unity of data to add in the end of tooltip values.
   */
  @Input() public dataUnit = '';
  /**
   * @Input
   * @description The date format of the start/end values.
   *  Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
   */
  @Input() public valuesDateFormat: string = null;
  /**
   * @Input
   * @description Whether the chart is selectable.
   */
  @Input() public isHistogramSelectable = true;
  /**
   * @Input
   * @description Whether the selection is multiple.
   */
  @Input() public multiselectable = false;
  /**
   * @Input
   * @description A single interval that selects data.
   */
  @Input() public intervalSelection: SelectedInputValues;
  /**
   * @Input
   * @description A list of intervals that select data.
   */
  @Input() public intervalListSelection: SelectedInputValues[];
  /**
   * @Input
   * @description Top position of the remove-selection-button.
   */
  @Input() public topOffsetRemoveInterval = 40;
  /**
   * @Input
   * @description leftOffsetRemoveInterval.
   */
  @Input() public leftOffsetRemoveInterval = 18;
  /**
   * @Input
   * @description A 0 to 1 weight of the brush height. It controls the brush handles height.
   */
  @Input() public brushHandlesHeightWeight = 1 / 2;
  /**
   * @Input
   * @description Chart's representation type.
   */
  @Input() public chartType: ChartType = ChartType.area;
  /**
   * @Input
   * @description Chart's title.
   */
  @Input() public chartTitle = '';
  /**
   * @Input
   * @description Chart's width. If not specified, the chart takes the component's container width.
   */
  @Input() public chartWidth: number = null;
  /**
   * @Input
   * @description Chart's height. If not specified, the chart takes the component's container height.
   */
  @Input() public chartHeight: number = null;
  /**
   * @Input
   * @description Css class name to use to customize a specific `arlas-histogram` component.
   */
  @Input() public customizedCssClass = '';

  /**
   * @Input
   * @description The xAxis positon : above or below the chart.
   */
  @Input() public xAxisPosition: Position = Position.bottom;
  /**
   * @Input
   * @description The start/end values positon : above or below the chart.
   */
  @Input() public descriptionPosition: Position = Position.bottom;
  /**
   * @Input
   * @description Number of ticks in the X axis.
   */
  @Input() public xTicks = 5;
  /**
   * @Input
   * @description Number of ticks in the Y axis.
   */
  @Input() public yTicks = 5;
  /**
   * @Input
   * @description Number of labels in the X axis.
   */
  @Input() public xLabels = 5;
  /**
   * @Input
   * @description Number of labels in the Y axis.
   */
  @Input() public yLabels = 5;
  /**
   * @Input
   * @description Whether showing the X axis ticks.
   */
  @Input() public showXTicks = true;
  /**
   * @Input
   * @description Whether showing the Y axis ticks.
   */
  @Input() public showYTicks = true;
  /**
   * @Input
   * @description Whether showing the X axis labels.
   */
  @Input() public showXLabels = true;
  /**
   * @Input
   * @description Whether showing the Y axis labels.
   */
  @Input() public showYLabels = true;
  /**
   * @Input
   * @description Whether showing the horizontal dashed lines.
   */
  @Input() public showHorizontalLines = true;
  /**
   * @Input
   * @description The date format of ticks.
   * Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
   */
  @Input() public ticksDateFormat: string = null;
  /**
   * @Input
   * @description Whether the curve of an `area` chart is smoothed.
   */
  @Input() public isSmoothedCurve = true;

  /**
   * @Input
   * @description Weight applied to bars width. ]0,1].
   */
  @Input() public barWeight = 0.6;
  /**
   * @Input
   * @description Either a hex string color or a color name (in English) or a saturation interval.
   */
  @Input() public paletteColors: [number, number] | string = null;
  /**
   * @Input
   * @description The swimlane representation mode.
   */
  @Input() public swimlaneMode: SwimlaneMode = SwimlaneMode.variableHeight;
  /**
   * @Input
   * @description The width of swimlane labels space.
   */
  @Input() public swimLaneLabelsWidth = null;
  /**
   * @Input
   * @description The radius of swimlane bars borders.
   */
  @Input() public swimlaneBorderRadius = 3;
  /**
   * @Input
   * @description The height of a single lane. If not specified, a lane height is the chartHeight devided by the number of lanes.
   */
  @Input() public swimlaneHeight: number = null;
  /**
   * @Output
   * @description Emits the list of selected intervals.
   */
  @Output() public valuesListChangedEvent: Subject<SelectedOutputValues[]> = new Subject<SelectedOutputValues[]>();

  /**
   * @Output
   * @description Emits the hovered bucket key (key as in HistogramData).
   */
  @Output() public hoveredBucketEvent: Subject<Date | number> = new Subject<Date | number>();

  public histogram: AbstractHistogram;
  public ChartType = ChartType;
  public Array = Array;

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) {
    Observable.fromEvent(window, 'resize')
      .debounceTime(500)
      .subscribe((event: Event) => {
        this.resizeHistogram(event);
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {

    if (this.histogram !== undefined) {
      this.histogram.histogramParams.histogramNode = this.viewContainerRef.element.nativeElement;
    } else {
      switch (this.chartType) {
        case ChartType.area : {
          this.histogram = new ChartArea();
          break;
        }
        case ChartType.bars : {
          this.histogram = new ChartBars();
          break;
        }
        case ChartType.oneDimension : {
          this.histogram = new ChartOneDimension();
          break;
        }
        case ChartType.swimlane : {
          if (this.swimlaneMode === SwimlaneMode.circles) {
            this.histogram = new SwimlaneCircles();
          } else {
            this.histogram = new SwimlaneBars();
          }
          break;
        }
        default : {
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
    }

    if (changes.intervalSelection && this.intervalSelection !== undefined && this.histogram !== undefined && this.isHistogramSelectable) {
      this.histogram.histogramParams.intervalSelection = this.intervalSelection;
      if (this.histogram.histogramParams.dataLength > 0) {
        this.histogram.setSelectedInterval(this.intervalSelection);
      }
    }

    if (changes.intervalListSelection && this.isHistogramSelectable && this.histogram !== undefined) {
      if (changes.intervalListSelection.currentValue) {
        this.histogram.histogramParams.intervalListSelection = this.intervalListSelection;
          this.histogram.redrawSelectedIntervals();
      }
    }
  }

  public ngOnInit() {

  }

  public ngAfterViewChecked() {
    if (this.chartType === ChartType.swimlane) {
      (<AbstractSwimlane>this.histogram).truncateLabels();
    }
  }

  public plotHistogram(inputData: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>): void {
    this.histogram.plot(inputData);
  }

  public resizeHistogram(e: Event): void {
    this.histogram.resize();
  }

  public removeSelectInterval(id: string) {
    this.histogram.removeSelectInterval(id);
  }

  public overRemove(e) {
    this.histogram.overRemove(e);
  }

  public leaveRemove() {
    this.histogram.leaveRemove();
  }

  private setHistogramParameters() {
    this.histogram.histogramParams = new HistogramParams();
    this.histogram.histogramParams.histogramNode = this.viewContainerRef.element.nativeElement;
    this.histogram.histogramParams.barWeight = this.barWeight;
    this.histogram.histogramParams.brushHandlesHeightWeight = this.brushHandlesHeightWeight;
    this.histogram.histogramParams.chartHeight = this.chartHeight;
    this.histogram.histogramParams.chartTitle = this.chartTitle;
    this.histogram.histogramParams.chartType = this.chartType;
    this.histogram.histogramParams.chartWidth = this.chartWidth;
    this.histogram.histogramParams.data = this.data;
    this.histogram.histogramParams.dataType = this.dataType;
    this.histogram.histogramParams.dataUnit = this.dataUnit;
    this.histogram.histogramParams.dateUnit = this.dateUnit;
    this.histogram.histogramParams.el = this.el;
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
    this.histogram.histogramParams.viewContainerRef = this.viewContainerRef;
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
  }
}
