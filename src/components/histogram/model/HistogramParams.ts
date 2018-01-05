import { ViewContainerRef, ElementRef } from '@angular/core';
import { ChartDimensions, ChartAxes, SwimlaneAxes, SelectedInputValues, SelectedOutputValues, HistogramUtils,
         ChartType, DataType, DateUnit, Position, Tooltip, MarginModel } from '../histogram.utils';
import { Subject } from 'rxjs/Subject';
import { SwimlaneMode } from '../histogram.utils';

export class HistogramParams {
  // ########################## Inputs ##########################

  /** Data */
  public data: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>;
  public dataType: DataType;
  public dataUnit: string;
  public dateUnit: DateUnit;
  public chartType: ChartType;
  public hoveredBucketEvent: Subject<Date | number>;


  /** Dimensions */
  public chartWidth: number;
  public chartHeight: number;

  /** Axes and ticks */
  public xTicks: number;
  public yTicks: number;
  public xLabels: number;
  public yLabels: number;
  public showXTicks: boolean;
  public showYTicks: boolean;
  public showXLabels: boolean;
  public showYLabels: boolean;
  public showHorizontalLines: boolean;
  public ticksDateFormat: string;
  public xAxisPosition: Position;

  /** Desctiption */
  public chartTitle: string;
  public valuesDateFormat: string;

  /** Bars */
  public paletteColors: [number, number] | string;
  public barWeight: number;
  public multiselectable: boolean;

  /** Area */
  public isSmoothedCurve: boolean;

  /** Selection & brush */

  public brushHandlesHeightWeight;
  public intervalSelection: SelectedInputValues;
  public intervalListSelection: SelectedInputValues[];
  public topOffsetRemoveInterval: number;
  public isHistogramSelectable;

  /** Swimlane */
  public swimlaneBorderRadius;
  public swimlaneMode: SwimlaneMode;
  public swimLaneLabelsWidth: number;
  public swimlaneHeight: number;

  // ########################## Outputs ##########################

  public valuesListChangedEvent: Subject<SelectedOutputValues[]>;


  // ########################## Parameter binded with HTML ##########################

  public histogramNode: any;
  public viewContainerRef: ViewContainerRef;
  public el: ElementRef;

  public margin: MarginModel = { top: 4, right: 10, bottom: 20, left: 60 };
  public tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };

  public displaySvg = 'none';
  public dataLength = 0;

  public startValue: string = null;
  public endValue: string = null;
  public showTitle = true;

  public intervalSelectedMap: Map<string, { values: SelectedOutputValues, x_position: number }>
    = new Map<string, { values: SelectedOutputValues, x_position: number }>();
  public selectionListIntervalId: string[] = [];

  public swimlaneDataDomain: Array<{ key: number, value: number }>;
  public swimlaneXTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
  public swimlaneTooltipsMap = new Map<string, Tooltip>();

  // ######################### Parameters set in the component ########################
  public hasDataChanged = false;
}
