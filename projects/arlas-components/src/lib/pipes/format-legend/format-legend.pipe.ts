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
export interface  LegendParamsResult {translKey: string; field?: string; normalized?: string; metric?: string; format: ParamsResultType;}
export type  ParamsResultType = 'full' | 'metricField' | 'metricNormalised' | 'original';
@Pipe({
  name: 'formatLegend'
})
export class FormatLegendPipe implements PipeTransform {
  private readonly metrics = [
   'avg', 'sum','min', 'max','cardinality', 'count'
  ];
  public transform(value: string): LegendParamsResult | null {
    let params: LegendParamsResult = {
      translKey: value,
      format: 'original'
    };

    if(!value) {
      return null;
    }
    const parts = value.split(':');
    if(parts.length === 2 || (parts.length === 1 && this.containsMetrics(parts[0]))){
      const valueSplit = parts[0].split('_');
      if(valueSplit.length === 0) {
        return params;
      }

      if(valueSplit[valueSplit.length - 1] === ''){
        valueSplit.splice(valueSplit.length - 1, 1);
      }

      const metric = this.getMetric(valueSplit);
      const field = this.getField(valueSplit);
      const normalised =  parts[1] ?? '';

      if(metric && field && normalised) {
        params =  {...params, field, normalized: normalised, metric, format: 'full', translKey: 'legend'};
      } else if(metric && !field && normalised) {
        params = {...params, normalized: normalised, metric, format: 'metricNormalised',  translKey: 'legend without field'};
      } else if (metric && field && !normalised) {
        params = {...params, field, normalized: normalised, metric, format: 'metricField',  translKey: 'legend without normalized'};
      }

      return params;
    }
    return params;
  }

  public getMetric(valueSplit: string[]){
    if(this.isMetrics(valueSplit[ valueSplit.length - 1])) {
      return valueSplit[valueSplit.length - 1];
    }
  }

  public getField(valueSplit: string[]){
    return valueSplit.slice(0, valueSplit.length - 1).join('_');
  }

  public isMetrics(metrics: string){
    return this.metrics.includes(metrics);
  }

  public containsMetrics(value: string){
    for (let i = 0; i < this.metrics.length; i++) {
      if(value.includes(this.metrics[i])){
        return true;
      }
    }
  }

}
