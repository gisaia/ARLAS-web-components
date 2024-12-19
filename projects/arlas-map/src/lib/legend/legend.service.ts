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
}
