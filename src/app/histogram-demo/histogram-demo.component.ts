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

import { Component, OnInit } from '@angular/core';
import { ChartType, DataType, SelectedInputValues, SelectedOutputValues, SwimlaneData, SwimlaneMode, SwimlaneStats } from 'arlas-d3';


@Component({
  selector: 'arlas-histogram-demo',
  templateUrl: './histogram-demo.component.html',
  styleUrls: ['./histogram-demo.component.css']
})
export class HistogramDemoComponent implements OnInit {
  public curvedTimelineData: Array<{key: Date | number; value: number; }>;
  public oneDimensionHistogramData: Array<Array<{ key: Date | number; value: number; }>>;
  public defaultHistogramData: Array<{key: Date | number; value: number; }>;
  public swimlaneHistogramData: SwimlaneData;
  public dataType = DataType;
  public swimlaneMode = SwimlaneMode;
  public chartType = ChartType;
  public selectedTimeValues: SelectedOutputValues = { startvalue: null, endvalue: null };
  public selectedNumericValues: SelectedOutputValues = { startvalue: null, endvalue: null };
  public selectValues: SelectedInputValues;
  public selectValuesSwimlane: SelectedInputValues;
  public areaSelection: SelectedInputValues;
  public intervalListSelection: SelectedOutputValues[] = [];

  public constructor() { }

  public ngOnInit() {
    this.showData();
  }

  public setSelectedTimeValues(selectedValues: Array<{ startvalue: Date; endvalue: Date; }>) {
    this.selectedTimeValues.startvalue = selectedValues[0].startvalue;
    this.selectedTimeValues.endvalue = selectedValues[0].endvalue;
    if (selectedValues.length === 1) {
      this.intervalListSelection = [];
    } else {
      selectedValues.pop();
      this.intervalListSelection = selectedValues;
    }
  }

  public setSelectedNumericValues(selectedValues: Array<{ startvalue: Date; endvalue: Date; }>) {
    this.selectedNumericValues.startvalue = selectedValues[0].startvalue;
    this.selectedNumericValues.endvalue = selectedValues[0].endvalue;

  }

  private showData() {
    this.defaultHistogramData = [
      {value: -400, key: 0},
      {value: 123,  key: 1},
      {value: -333, key: 2},
      {value: -400, key: 3},
      {value: -400, key: 4},
      {value: -212, key: 5},
      {value: -111, key: 6},
      {value: -400, key: 7},
      {value: -400, key: 8},
      {value: -120, key: 9},
      {value: -120, key: 10},
      {value: -123, key: 11},
      {value: -100, key: 12},
      {value: -222, key: 13},
      {value: -120, key: 14},
    ];

    this.curvedTimelineData = [
      {value: 400, key: 1574208000000},
      {value: 123, key: 1574209000000},
      {value: 333, key: 1574210000000},
      {value: 400, key: 1574211000000},
      {value: 400, key: 1574212000000},
      {value: 212, key: 1574213000000},
      {value: 111, key: 1574214000000},
      {value: 400, key: 1574215000000},
      {value: 400, key: 1574216000000},
      {value: 120, key: 1574217000000},
      {value: 120, key: 1574218000000},
      {value: 123, key: 1574219000000},
      {value: 100, key: 1574220000000},
      {value: 222, key: 1574221000000},
      {value: 120, key: 1574222000000},
    ];

    const lanes = new Map<string, Array<{key: number; value: number;}>>();
    lanes.set('Sweden', [
      {key: 1574208000000, value: 46428},
      {key: 1574211600000, value: 2278},
      {key: 1574215200000, value: 3567},
      {key: 1574218800000, value: 4716},
      {key: 1574222400000, value: 5883},
      {key: 1574226000000, value: 3529}
    ]);
    lanes.set('Denmark', [
      {key: 1574208000000, value: 4958},
      {key: 1574211600000, value: 95848},
      {key: 1574215200000, value: 359},
      {key: 1574218800000, value: 2954},
      {key: 1574222400000, value: 394},
      {key: 1574226000000, value: 38454}
    ]);
    lanes.set('Norway', [
      {key: 1574208000000, value: 3564},
      {key: 1574211600000, value: 4534},
      {key: 1574215200000, value: 35334},
      {key: 1574218800000, value: 3642},
      {key: 1574222400000, value: 742},
      {key: 1574226000000, value: 2563}
    ]);

    let sum = 0;
    let max = -Infinity;
    let min = Infinity;

    lanes.forEach(v => {
      v.forEach(val => {
        sum += val.value;
        if (max < val.value) {
          max = val.value;
        }
        if ( min > val.value) {
          min = val.value;
        }
      });
    });

    const columnStats = new Map();
    const keys = lanes.get('Sweden').map(bucket => bucket.key);

    keys.forEach((val, idx) => {
      let sum = 0;
      let max = -Infinity;
      let min = Infinity;
      lanes.forEach(lane => {
        sum += lane[idx].value;
        if (max < lane[idx].value) {
          max = lane[idx].value;
        }
        if ( min > lane[idx].value) {
          min = lane[idx].value;
        }
      });
      columnStats.set(val, {
        max: max,
        min: min,
        sum: sum
      });
    });

    const stats: SwimlaneStats = {
      bucketLength: 3600000,
      columnStats: columnStats,
      globalStats: {
        min: min,
        max: max,
        sum: sum,
        count: 18
      },
      maxBorder: 1574226000000,
      minBorder: 1574208000000,
      nbLanes: 3
    };

    this.swimlaneHistogramData = {
      lanes: lanes,
      stats: stats
    };
  }



  private stringToNumber(d) {
    d.value = +d.value;
    return d;
  }

  private oneToZero(d) {
    d.value = +d.value / 1450;
    return d;
  }





}
