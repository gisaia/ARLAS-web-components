export const areaChart = 'area';
export const barsChart = 'bars';
export const timelineType = 'timeline';
export const histogramType = 'histogram';

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

export interface SelectedValues {
  startvalue: Date|number;
  endvalue: Date|number;
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
