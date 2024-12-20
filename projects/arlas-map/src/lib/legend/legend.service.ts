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

import { Injectable } from '@angular/core';
import { CircleLegend, FillLegend, HeatmapLegend, LabelLegend, Legend, LegendData, LineLegend } from './legend.config';
import { TranslateService } from '@ngx-translate/core';
import { IN, NOT_IN } from '../map/model/filters';


@Injectable({
  providedIn: 'root'
})
export abstract class LegendService {

  public static buildColorLegend(colorExpression: string | any, visibleMode: boolean, legendData: Map<string, LegendData>,
    filter?: any, translate?: TranslateService): [Legend, string] {

    return [undefined, ''];
  };

  public getCircleLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: any): CircleLegend {
    return undefined;
  }

  public getLineLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: any): LineLegend {
    return undefined;
  }

  public getFillLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: any): FillLegend {
    return undefined;
  }

  public getHeatmapLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: any): HeatmapLegend {
    return undefined;
  }

  public getLabelLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: any): LabelLegend {
    return undefined;
  }
  public static filterLegend(colorLegendValues: Map<string, string | number>, filter: any[], field: string) {
    filter.forEach((f, idx) => {
      if (idx !== 0 && idx !== filter.length - 1) {
        switch (f[0]) {
          case IN: {
            if (f[1][1] === field) {
              const valuesToKeep: Array<string> = f[2][1];
              colorLegendValues.forEach((val, key) => {
                if (!(valuesToKeep.includes(key))) {
                  colorLegendValues.delete(key);
                }
              });
            }
            break;
          }
          case NOT_IN: {
            if (f[1][0] === IN && f[1][1][1] === field) {
              const valuesToExclude: Array<string> = f[1][2][1];
              valuesToExclude.forEach(value => {
                colorLegendValues.delete(value);
              });
            }
            break;
          }
        }
      }
    });
  }
}
