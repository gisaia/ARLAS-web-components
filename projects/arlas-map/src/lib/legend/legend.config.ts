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

import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';

export interface LegendData {
  minValue?: string;
  maxValue?: string;
  keysColorsMap?: Map<string, string>;
}

export interface Legend {
  type?: PROPERTY_SELECTOR_SOURCE;
  title?: string;
  minValue?: string;
  maxValue?: string;
  fixValue?: string | number;
  interpolatedValues?: Array<string | number>;
  manualValues?: Map<string, string | number>;
  visible?: boolean;
  /** data to be plotted as histogram in the legend */
  histogram?: Array<HistogramData>;
}

export interface CircleLegend extends FillLegend {
  radius: Legend;
}

export interface FillLegend {
  color: Legend;
  colorPalette: string;
  strokeColor: Legend;
  strokeColorPalette: string;
}

export interface HeatmapLegend {
  color: Legend;
  colorPalette: string;
  radius: Legend;
}

export interface LabelLegend {
  color: Legend;
  colorPalette: string;
  size: Legend;
}

export interface LineLegend {
  color: Legend;
  colorPalette: string;
  dashes: Array<number>;
  width: Legend;
}

export enum PROPERTY_SELECTOR_SOURCE {
  fix = 'Fix',
  provided = 'Provided',
  generated = 'Generated',
  manual = 'Manual',
  interpolated = 'Interpolated',
  metric_on_field = 'Metric on field',
  heatmap_density = 'Density'
}
