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

import { CommonModule } from '@angular/common';

import { NgModule } from '@angular/core';
import { ArlasMapService } from '../../../projects/arlas-maplibre/src/lib/arlas-map.service';
import { AbstractArlasMapService } from '../../../projects/arlas-map/src/lib/arlas-map.service';
import { ArlasMapFrameworkService } from '../../../projects/arlas-map/src/lib/arlas-map-framework.service';
import { ArlasMaplibreService } from '../../../projects/arlas-maplibre/src/lib/arlas-maplibre.service';
import { ArlasMaplibreModule } from '../../../projects/arlas-maplibre/src/lib/arlas-maplibre.module';
import { BasemapService } from '../../../projects/arlas-map/src/lib/basemaps/basemap.service';
import { LegendService } from '../../../projects/arlas-map/src/lib/legend/legend.service';
import { MaplibreBasemapService } from '../../../projects/arlas-maplibre/src/lib/basemaps/maplibre-basemap.service';
import { MaplibreLegendService } from '../../../projects/arlas-maplibre/src/lib/legend/legend.service';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ArlasMapModule } from '../../../projects/arlas-map/src/lib/arlas-map.module';
import { MapSettingsModule } from '../../../projects/arlas-map/src/lib/map-settings/map-settings.module';

@NgModule({
    imports: [
        CommonModule,
        MatRadioModule,
        MatIconModule,
        FormsModule,
        ArlasMaplibreModule,
        MapSettingsModule,
        ArlasMapModule
    ],
    providers: [
        {
            provide: AbstractArlasMapService,
            useClass: ArlasMapService
        },
        ArlasMapService,
        {
            provide: BasemapService,
            useClass: MaplibreBasemapService
        },
        {
            provide: LegendService,
            useClass: MaplibreLegendService
        },
        {
            provide: ArlasMapFrameworkService,
            useClass: ArlasMaplibreService
        },
    ]
})
export class MaplibreDemoModule {

}