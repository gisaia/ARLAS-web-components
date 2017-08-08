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

export interface SelectedOutputValues {
  startvalue: Date|number;
  endvalue: Date|number;
}

export interface SelectedInputValues {
  startvalue: number;
  endvalue: number;
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
  xAxis: d3.Axis<any>;
  yAxis: d3.Axis<any>;
  stepWidth: number;
}

export enum DateUnit {
  second, millisecond
}

export enum DataType {
  numeric, time
}

export enum ChartType {
  area, bars
}
