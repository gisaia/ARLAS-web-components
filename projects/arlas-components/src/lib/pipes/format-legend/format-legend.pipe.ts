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
import { Pipe, PipeTransform } from '@angular/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

export interface LegendParamsResult {
  translateKey: string;
  field?: string;
  normalized?: string;
  metric?: string;
  format: ParamsResultType;
}

/**
 * full :
 *  return all interpolated values to construct a title legend
 *  ex: Average of boats (normalized)
 * metricField :
 *  return metric and field interpolated values.
 *  ex: Average of boats
 * metricNormalised :
 *   return metric and normalized interpolated values.
 *   ex: count (normalized)
 * original
 *   return the original key to be translated. This case appear only if we fail
 *   to parse of if we have an error.
 */
export type  ParamsResultType = 'full' | 'metricField' | 'metricNormalised' | 'original';

@Pipe({
  name: 'formatLegend'
})
export class FormatLegendPipe implements PipeTransform {
  private readonly metrics: string[] = [
    marker('avg'),
    marker('sum'),
    marker('min'),
    marker('max'),
    marker('cardinality'),
    marker('count')
  ];

  public transform(field: string): LegendParamsResult | null {
    let params: LegendParamsResult = {
      translateKey: field,
      format: 'original'
    };

    if (!field) {
      return null;
    }

    const parts = field.split(':');
    const containsNormalizedPartOrMetric = parts.length === 2 ||
      (parts.length === 1 && this.containsMetrics(parts[0]));

    if (containsNormalizedPartOrMetric) {
      const valueSplit = parts[0].split('_');
      if (valueSplit.length === 0) {
        return params;
      }

      const hasExtraEmptyValue = valueSplit[valueSplit.length - 1] === '';
      if (hasExtraEmptyValue) {
        valueSplit.splice(valueSplit.length - 1, 1);
      }

      const metric = this.getMetric(valueSplit);
      const field = this.getField(valueSplit);
      const normalised = parts[1] ?? '';
      params = this.buildInterpolatedParams(params, metric, field, normalised);
    } else if (parts[0].endsWith('_arlas__color')){
      params.translateKey = params.translateKey.replace('_arlas__color', '');
    }

    return params;
  }

  public buildInterpolatedParams(params: LegendParamsResult, metric: string, field: string, normalised: string): LegendParamsResult {
    const legendParams = {
      ...params,
      field: '',
      normalized: '',
      metric,
    };

    if (field && normalised) {
      legendParams.field = field;
      legendParams.format = 'full';
      legendParams.translateKey = marker('legend');
    } else if (field) {
      legendParams.field = field;
      legendParams.format = 'metricField';
      legendParams.translateKey =  marker('legend without normalized');
    } else if (normalised){
      legendParams.field = field;
      legendParams.format = 'metricNormalised';
      legendParams.translateKey =  marker('legend without field');
    }

    return legendParams;
  }

  public getMetric(valueSplit: string[]) {
    if (this.isMetrics(valueSplit[valueSplit.length - 1])) {
      return valueSplit[valueSplit.length - 1];
    }
  }

  public getField(valueSplit: string[]) {
    return valueSplit.slice(0, valueSplit.length - 1).join('_');
  }

  public isMetrics(metrics: string) {
    return this.metrics.includes(metrics);
  }

  public containsMetrics(value: string) {
    for (let i = 0; i < this.metrics.length; i++) {
      if (value.includes(this.metrics[i])) {
        return true;
      }
    }
  }

}
