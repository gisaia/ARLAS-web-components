/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { KeyValuePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewChecked, AfterViewInit, Component, DestroyRef, ElementRef, inject, input,
  Input, OnChanges, output, Output, SimpleChanges, ViewChild, ViewEncapsulation
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  AbstractChart, AbstractHistogram, AbstractSwimlane, ChartArea, ChartBars, ChartCurve, ChartOneDimension, ChartType,
  DataType, HistogramData, HistogramParams, HistogramTooltip, Position, SelectedInputValues, SelectedOutputValues,
  SelectionType, SwimlaneBars, SwimlaneCircles, SwimlaneData, SwimlaneMode, SwimlaneOptions, SwimlaneRepresentation, XBucket
} from 'arlas-d3';
import { debounceTime, fromEvent, Subject } from 'rxjs';
import { GetCollectionUnitPipe } from '../../pipes/get-collection-unit/get-collection-unit.pipe';
import { ArlasColorService } from '../../services/color.generator.service';
import { NUMBER_FORMAT_CHAR } from '../componentsUtils';
import { HistogramKeyPipe } from './histogram-key.pipe';
import * as histogramJsonSchema from './histogram.schema.json';
import * as swimlaneJsonSchema from './swimlane.schema.json';

/**
 * The Histogram web component allows you to display your numeric and temporal data in charts or swimlanes.
 * Charts can be represented as bars or areas.
 * Swimlanes can be represented as bars or circles.
 * For both modes, data can be multi-selected using a selection brush.
 */
@Component({
    selector: 'arlas-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
      NgClass, MatIconButton, MatTooltip, MatIcon, KeyValuePipe, TranslatePipe, GetCollectionUnitPipe, HistogramKeyPipe, NgTemplateOutlet]
})
export class HistogramComponent implements AfterViewInit, OnChanges, AfterViewChecked {

  @ViewChild('left', { read: ElementRef, static: false }) private readonly lt?: ElementRef;
  @ViewChild('right', { read: ElementRef, static: false }) private readonly rt?: ElementRef;

  /**
   * @Input : Angular
   * @description Data to plot in the chart.
   */
  public data = input.required<HistogramData[] | SwimlaneData>();
  /**
   * @Input : Angular
   * @description HistogramData is a bucket of a given chart Id. Many charts ids can be represented in histogram. This
   * input sets the main chart id. So that the main one can be represented differently from the others
   */
  public mainChartId = input<string>();
  /**
   * @Input
   * @description To be set to `time` when x axis represents dates and to `numeric` otherwise.
   */
  @Input() public dataType: DataType = DataType.numeric;
  /**
   * @description Unit of data to add in the end of tooltip values.
   * @deprecated If xUnit is specified, dataUnit is not taken into account.
   */
  @Input() public dataUnit = '';
  /**
   * @description Unit of x axis values.
   */
  @Input() public xUnit = '';
  /**
   * @description Unit of y axis values.
   */
  @Input() public yUnit = '';
  /**
   * @Input : Angular
   * @description The date format of the start/end values.
   *  Please refer to this [list of specifiers](https://github.com/d3/d3-time-format/blob/master/README.md#locale_format).
   */
  @Input() public valuesDateFormat = '';
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
  @Input() public intervalSelection?: SelectedInputValues;
  /**
   * @Input : Angular
   * @description A list of intervals that select data.
   */
  @Input() public intervalListSelection: SelectedInputValues[] = [];
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
   * @description A 0 to 1 weight of the brush handles height.
   * This input will be taken into account when selectionType is 'rectangle'.
   * (This input will be renamed handlesHeightWeight in the v25.0.0 release.)
   */
  @Input() public brushHandlesHeightWeight = 1;
  /**
   * @Input : Angular
   * @description Radius of handles in pixels. This input will be taken into account when selectionType is 'slider'.
   */
   @Input() public handlesRadius = 4;
  /**
   * @Input : Angular
   * @description Radius of handles in pixels. This input will be taken into account when selectionType is 'slider'.
   */
  @Input() public selectionType: SelectionType = SelectionType.slider;
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
   * @description Chart's label for the x axis (Visible when there is one bucket on the histogram).
   */
  @Input() public chartXLabel = '';

  /**
   * @Input : Angular
   * @description Chart's label for the y axis (Visible when there is one bucket on the histogram).
   */
  @Input() public chartYLabel = '';
  /**
   * @Input : Angular
   * @description Chart's width. If not specified, the chart takes the component's container width.
   */
  @Input() public chartWidth?: number;
  /**
   * @Input : Angular
   * @description Chart's height. If not specified, the chart takes the component's container height.
   */
  @Input() public chartHeight?: number;
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
   * @description Display short labels on y axis.
   */
  @Input() public shortYLabels = false;
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
  @Input() public ticksDateFormat = '%d %b %Y  %H:%M';
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
  @Input() public paletteColors?: [number, number] | string;
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
   * @description The swimlane mode.
   * - `variableHeight` buckets height varies with the bucket's value
   * - `fixedHeight` all the buckets have the same height. A level tick is plotted on the bucket to indicate
   * the value level compared to other values.
   * - `circles` buckets are represented with circles whose radius varies the bucket's value.
   */
  @Input() public swimlaneMode: SwimlaneMode = SwimlaneMode.variableHeight;
  /**
   * @Input : Angular
   * @description The swimlane representation.
   * - `column` representation focuses on terms of the same column; each term is compared to the sum of all terms values in the column.
   * - `global` representation compares all the buckets values to the maximum value in the swimlane.
   */
  @Input() public swimlaneRepresentation: SwimlaneRepresentation = SwimlaneRepresentation.global;

  /**
   * @Input : Angular
   * @description Graphical options to configure for the swimlane.
  */
  @Input() public swimlaneOptions: SwimlaneOptions = {};
  /**
   * @Input : Angular
   * @description The width of swimlane labels space.
   */
  @Input() public swimLaneLabelsWidth?: number;
  /**
   * @Input : Angular
   * @description The radius of swimlane bars borders.
   */
  @Input() public swimlaneBorderRadius = 3;
  /**
   * @Input : Angular
   * @description The height of a single lane. If not specified, a lane height is the chartHeight devided by the number of lanes.
   */
  @Input() public swimlaneHeight?: number;

  public id = input.required<string>();
  /**
   * @Input : Angular
   * @description Term's list of powerbars to select
   */
  @Input() public selectedSwimlanes = new Set<string>();
  /**
 * @Input : Angular
 * @description Wether use UTC to display date on the app
 */
  @Input() public useUtc = true;

  /**
   * @Input : Angular
   * @description Whether to display the export button
   */
  public displayExportButton = input<boolean>(false);

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
  @Output() public hoveredBucketEvent = new Subject<XBucket | undefined>();
  /**
   * @Output : Angular
   * @description Emits an event informing that the chart finished plotting.
   */
  @Output() public dataPlottedEvent = new Subject<string>();
  /**
   * @Output : Angular
   * @description Emits the hovered bucket information that can be exploited to display a tooltip
   */
  @Output() public tooltipEvent = new Subject<HistogramTooltip>();

  /**
   * @Output : Angular
   * @description Emits when the export button is clicked
   */
  public exportEvent = output<void>();

  public histogram?: AbstractHistogram;
  public chart?: AbstractChart | AbstractSwimlane;

  public ChartType = ChartType;
  public Position = Position;
  public Array = Array;

  private readonly destroyRef = inject(DestroyRef);

  public constructor(
    private readonly colorService: ArlasColorService,
    private readonly el: ElementRef<HTMLElement>,
    private readonly translate: TranslateService
  ) {
    fromEvent(globalThis, 'resize')
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((event: Event) => {
        this.resizeHistogram();
      });
  }

  /**
   * Once the histogram is done loading, resize it to account for any changes applied via styling
   */
  public ngAfterViewInit(): void {
    this.resizeHistogram();
  }

  public static getHistogramJsonSchema(): Object {
    return histogramJsonSchema;
  }

  public static getSwimlaneJsonSchema(): Object {
    return swimlaneJsonSchema;
  }


  public ngOnChanges(changes: SimpleChanges): void {
    if (this.histogram === undefined) {
      const histogramParams = this.getHistogramParameters();
      switch (this.chartType) {
        case ChartType.area: {
          this.histogram = new ChartArea(histogramParams);
          this.chart = this.histogram as ChartArea;
          break;
        }
        case ChartType.curve: {
          this.histogram = new ChartCurve(histogramParams);
          this.chart = this.histogram as ChartCurve;
          break;
        }
        case ChartType.bars: {
          this.histogram = new ChartBars(histogramParams);
          this.chart = this.histogram as ChartBars;
          break;
        }
        case ChartType.oneDimension: {
          this.histogram = new ChartOneDimension(histogramParams);
          this.chart = this.histogram as ChartOneDimension;
          break;
        }
        case ChartType.swimlane: {
          if (this.swimlaneMode === SwimlaneMode.circles) {
            this.histogram = new SwimlaneCircles(histogramParams);
          } else {
            this.histogram = new SwimlaneBars(histogramParams);
          }
          break;
        }
        default: {
          this.histogram = new ChartArea(histogramParams);
          break;
        }
      }
    }

    if (changes.data && !!this.data() && this.histogram !== undefined) {
      const data = this.data();
      if (Array.isArray(data)) {
        this.histogram.histogramParams.histogramData = data;
      } else {
        this.histogram.histogramParams.swimlaneData = data;
      }
      this.histogram.histogramParams.hasDataChanged = true;
      this.plotHistogram(this.data());
      this.histogram.histogramParams.hasDataChanged = false;
      this.dataPlottedEvent.next('DATA_PLOTTED');
    }

    if (changes.intervalSelection && this.intervalSelection !== undefined && this.histogram !== undefined && this.isHistogramSelectable) {
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

  public ngAfterViewChecked() {
    if (this.chartType === ChartType.swimlane) {
      (<AbstractSwimlane>this.histogram).truncateLabels();
    }
    if (this.rt !== undefined && this.lt !== undefined) {
      this.histogram?.setHTMLElementsOfBrushCornerTooltips(this.rt.nativeElement, this.lt.nativeElement);
    }
  }

  /**
   * @description Plots the histogram
   */
  public plotHistogram(inputData: HistogramData[] | SwimlaneData): void {
    if (!this.chart) {
      return;
    }

    if (Array.isArray(inputData)) {
      (this.chart as AbstractChart).plot(inputData);
    } else {
      (this.chart as AbstractSwimlane).plot(inputData);
    }
  }

  /**
   * @description Resizes the histogram on windows resize event
   */
  public resizeHistogram(): void {
    if (this.histogram?.histogramParams.histogramContainer) {
      this.histogram.resize(this.histogram.histogramParams.histogramContainer);
      this.dataPlottedEvent.next('RESIZE');
    }
  }

  /**
   * @description Removes the selected interval
   */
  public removeSelectInterval(id: string) {
    (<AbstractChart>this.histogram).removeSelectInterval(id);
  }

  private getHistogramParameters() {
    if (!this.chartXLabel) {
      this.chartXLabel = '';
    }
    if (!this.chartYLabel) {
      this.chartYLabel = '';
    }
    if (!this.xUnit && this.dataUnit) {
      this.xUnit = this.dataUnit;
    } else if (!this.xUnit) {
      this.xUnit = '';
    }

    if (!this.yUnit) {
      this.yUnit = '';
    }
    if (!this.selectionType) {
      this.selectionType = SelectionType.slider;
    }
    const histogramParams = new HistogramParams(this.id());
    histogramParams.mainChartId = this.mainChartId();
    histogramParams.useUtc = this.useUtc;
    histogramParams.selectionType = this.selectionType;
    histogramParams.handlesRadius = this.handlesRadius;
    if (histogramParams.useUtc === undefined) {
      histogramParams.useUtc = true;
    }
    histogramParams.barWeight = this.barWeight;
    histogramParams.numberFormatChar = this.translate.instant(NUMBER_FORMAT_CHAR);
    histogramParams.handlesHeightWeight = this.brushHandlesHeightWeight;
    if (this.chartHeight) {
      histogramParams.chartHeight = this.chartHeight;
    }
    histogramParams.chartTitle = this.chartTitle;
    histogramParams.chartType = this.chartType;
    if (this.chartWidth) {
      histogramParams.chartWidth = this.chartWidth;
    }

    const data = this.data();
    if (Array.isArray(data)) {
      histogramParams.histogramData = data;
    } else {
      histogramParams.swimlaneData = data;
    }
    histogramParams.dataType = this.dataType;
    histogramParams.dataUnit = this.xUnit;
    histogramParams.hoveredBucketEvent = this.hoveredBucketEvent;
    histogramParams.intervalListSelection = this.intervalListSelection;
    histogramParams.isHistogramSelectable = this.isHistogramSelectable;
    histogramParams.isSmoothedCurve = this.isSmoothedCurve;
    histogramParams.multiselectable = this.multiselectable;
    histogramParams.paletteColors = this.paletteColors;
    histogramParams.showHorizontalLines = this.showHorizontalLines;
    histogramParams.showXLabels = this.showXLabels;
    histogramParams.showXTicks = this.showXTicks;
    histogramParams.showYLabels = this.showYLabels;
    histogramParams.showYTicks = this.showYTicks;
    histogramParams.ticksDateFormat = this.ticksDateFormat;
    histogramParams.valuesDateFormat = this.valuesDateFormat;
    histogramParams.valuesListChangedEvent = this.valuesListChangedEvent;
    histogramParams.xAxisPosition = this.xAxisPosition;
    histogramParams.xLabels = this.xLabels;
    histogramParams.xTicks = this.xTicks;
    histogramParams.yLabels = this.yLabels;
    histogramParams.yTicks = this.yTicks;
    histogramParams.shortYLabels = this.shortYLabels;
    if (this.swimLaneLabelsWidth) {
      histogramParams.swimLaneLabelsWidth = this.swimLaneLabelsWidth;
    }
    if (this.swimlaneHeight) {
      histogramParams.swimlaneHeight = this.swimlaneHeight;
    }
    histogramParams.swimlaneBorderRadius = this.swimlaneBorderRadius;
    histogramParams.swimlaneMode = this.swimlaneMode;
    histogramParams.swimlaneOptions = this.swimlaneOptions;
    histogramParams.swimlaneRepresentation = this.swimlaneRepresentation !== undefined ?
      this.swimlaneRepresentation : SwimlaneRepresentation.global;
    histogramParams.histogramContainer = this.el.nativeElement.getElementsByClassName('histogram').item(0) as HTMLElement;
    histogramParams.svgNode = histogramParams.histogramContainer.querySelector('svg');
    histogramParams.displayOnlyIntervalsWithData = this.displayOnlyIntervalsWithData;
    histogramParams.yAxisFromZero = this.yAxisStartsFromZero;
    histogramParams.showStripes = this.showStripes;
    histogramParams.moveDataByHalfInterval = this.applyOffsetOnAreaChart;
    histogramParams.selectedSwimlanes = this.selectedSwimlanes;
    histogramParams.selectedSwimlanesEvent = this.selectedSwimlanesEvent;
    histogramParams.colorGenerator = this.colorService;
    histogramParams.tooltipEvent
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(t => {
        t.title = this.chartTitle;
        t.xLabel = this.chartXLabel;
        t.yLabel = this.chartYLabel;
        t.xUnit = this.xUnit;
        t.yUnit = this.yUnit;
        this.tooltipEvent.next(t);
      });

    return histogramParams;
  }
}
