import * as d3 from 'd3';
import { MarginModel } from '../histogram/histogram.utils';

export interface DonutDimensions {
  svg: d3.Selection< d3.BaseType, any, d3.BaseType, any>;
  width: number;
  height: number;
  radius: number;
}

export interface DonutArc {
  name: string;
  ringName: string;
  isOther: false;
  size?: number;
  children: Array<DonutArc>;
}
