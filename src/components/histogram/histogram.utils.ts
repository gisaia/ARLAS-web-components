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

export enum DateType {
  second, millisecond
}
