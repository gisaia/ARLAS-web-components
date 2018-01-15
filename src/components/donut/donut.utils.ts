import * as d3 from 'd3';
import { MarginModel } from '../histogram/histogram.utils';

export interface DonutNode extends d3.HierarchyRectangularNode<{}> {
}

export interface DonutDimensions {
    svg: d3.Selection< d3.BaseType, any, d3.BaseType, any>;
    margin: MarginModel;
    width: number;
    height: number;
    radius: number;
}

export interface DonutData {
  name: string;
  size?: number;
  children: Array<DonutData>;
}

export function getHexColorFromString(text: string): string {
  // string to int
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
     hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  // int to rgb
  let hex = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  const colorHex = '#' + "00000".substring(0, 6 - hex.length) + hex
  return colorHex;
}
