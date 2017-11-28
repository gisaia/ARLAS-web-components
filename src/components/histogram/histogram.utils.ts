import * as d3 from 'd3';

export interface MarginModel {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface HistogramData {
  key: Date|number;
  value: number;
}

export interface SwimlaneData {
  key: string;
  value: Array<{ key: number, value: number }>;
}

export interface SwimlaneParsedData {
  key: string;
  value: Array<{ key: number | Date, value: number }>;
}

export interface SelectedOutputValues {
  startvalue: Date|number;
  endvalue: Date|number;
}

export interface SelectedInputValues {
  startvalue: Date | number;
  endvalue: Date | number;
}

export interface ChartDimensions {
  svg: d3.Selection< d3.BaseType, any, d3.BaseType, any>;
  margin: MarginModel;
  width: number;
  height: number;
}

export interface ChartAxes {
  xDomain: any;
  xDataDomain: any;
  yDomain: d3.ScaleLinear<number, number>;
  xTicksAxis: d3.Axis<any>;
  xLabelsAxis: d3.Axis<any>;
  yTicksAxis: d3.Axis<any>;
  yLabelsAxis: d3.Axis<any>;
  stepWidth: number;
  xAxis: d3.Axis<any>;
}

export interface SwimlaneAxes {
  xDomain: any;
  xDataDomainArray: Array<any>;
  xTicksAxis: d3.Axis<any>;
  xLabelsAxis: d3.Axis<any>;
  stepWidth: number;
  xAxis: d3.Axis<any>;
}

export interface Tooltip {
  isShown: boolean;
  isRightSide: boolean;
  xPosition: number;
  yPosition: number;
  xContent: string;
  yContent: string;
}

export enum DateUnit {
  second, millisecond
}

export enum SwimlaneMode {
  variableHeight, fixedHeight, circles
}
export enum DataType {
  numeric, time
}

export enum ChartType {
  area, bars, oneDimension, swimlane
}

export enum Position {
  top, bottom
}
