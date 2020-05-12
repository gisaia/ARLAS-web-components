import { StyleFunction, Expression } from 'mapbox-gl';
import { TranslateService } from '@ngx-translate/core';

export const GET = 'get';
export const MATCH = 'match';
export const INTERPOLATE = 'interpolate';
export const OTHER = 'other_color';
export class ColorLegend {
  public colorLegend: Legend = {};
  public PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;

  constructor(public translate: TranslateService) {
    this.colorLegend = {};
    this.colorLegend.manualValues = new Map();
    this.colorLegend.interpolatedValues = new Array();
  }

  protected buildColorLegend(color: string | StyleFunction | Expression, legendData?: any): void {
    if (typeof color === 'string') {
      this.colorLegend.type = PROPERTY_SELECTOR_SOURCE.fix;
    } else if (Array.isArray(color)) {
      if (color.length === 2) {
        /** color = ["get", "field"]  ==> Generated or Provided */
        // todo
      } else if (color.length >= 3) {
        if (color[0] === MATCH) {
          /** color = ["match", ["get", "field"], .... ]**/
          this.colorLegend.type = PROPERTY_SELECTOR_SOURCE.manual;
          const colorsLength = color.length - 2;
          let hasDefaultColor = false;
          if (colorsLength % 2 !== 0) {
            hasDefaultColor = true;
          }
          for (let i = 2; i < color.length; i += 2) {
            if (hasDefaultColor && i === colorsLength - 1) {
              this.colorLegend.manualValues.set(this.translate.instant(OTHER), color[i]);
            } else {
              this.colorLegend.manualValues.set(this.translate.instant(color[i]), color[i + 1]);
            }
          }
        } else if (color[0] === INTERPOLATE) {
          this.colorLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
          /** color = ["interplate", ['linear'], ["get", "field"], 0, 1... ]**/
          // todo throw exception if interpolation is not linear
          const field = color[2][1];
          this.colorLegend.title = field;
          if (legendData && legendData.get(field)) {
            this.colorLegend.minValue = legendData.get(field).minValue;
            this.colorLegend.maxValue = legendData.get(field).maxValue;
          }
          this.colorLegend.interpolatedValues = color.filter((c, i) => i > 2 && i % 2 === 0);
        }
      }
    }
  }
}

export interface Legend {
  type?: PROPERTY_SELECTOR_SOURCE;
  title?: string;
  minValue?: string;
  maxValue?: string;
  fixValue?: string | number;
  interpolatedValues?: Array<string> | Array<number>;
  manualValues?: Map<string, string | number>;
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
