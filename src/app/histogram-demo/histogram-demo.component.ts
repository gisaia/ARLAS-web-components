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
import { DataType, ChartType, SelectedOutputValues, SelectedInputValues, SwimlaneMode } from 'arlas-d3';


@Component({
  selector: 'arlas-histogram-demo',
  templateUrl: './histogram-demo.component.html',
  styleUrls: ['./histogram-demo.component.css']
})
export class HistogramDemoComponent implements OnInit {
  public curvedTimelineData: Array<{key: Date | number, value: number}>;
  public barsHistogramData: Array<Array<{key: Date | number, value: number}>>;
  public oneDimensionHistogramData: Array<Array<{key: Date | number, value: number}>>;
  public defaultHistogramData: Array<{key: Date | number, value: number}>;
  public swimlaneHistogramData: Map<any, any>;
  public dataType = DataType;
  public swimlaneMode = SwimlaneMode;
  public chartType = ChartType;
  public selectedTimeValues: SelectedOutputValues = { startvalue: null, endvalue: null };
  public selectedNumericValues: SelectedOutputValues = { startvalue: null, endvalue: null };
  public selectValues: SelectedInputValues;
  public selectValuesSwimlane: SelectedInputValues;
  public areaSelection: SelectedInputValues;
  public intervalListSelection: SelectedOutputValues[] = [];

  constructor() { }

  public ngOnInit() {
    this.showData();
  }

  public setSelectedTimeValues(selectedValues: Array<{ startvalue: Date, endvalue: Date }>) {
    this.selectedTimeValues.startvalue = selectedValues[0].startvalue;
    this.selectedTimeValues.endvalue = selectedValues[0].endvalue;
    if (selectedValues.length === 1) {
      this.intervalListSelection = [];
    } else {
      selectedValues.pop();
      this.intervalListSelection = selectedValues;
    }
  }

  public setSelectedNumericValues(selectedValues: Array<{ startvalue: Date, endvalue: Date }>) {
    this.selectedNumericValues.startvalue = selectedValues[0].startvalue;
    this.selectedNumericValues.endvalue = selectedValues[0].endvalue;

  }

  private showData() {
    this.defaultHistogramData = [
      {value: -400,   key: 0},
      {value: -123,  key: 1},
      {value: -333,  key: 2},
      {value: -400,  key: 3},
      {value: -400,  key: 4},
      {value: -212,  key: 5},
      {value: -111,  key: 6},
      {value: -400,  key: 7},
      {value: -400, key: 8},
      {value: -120, key: 9},
      {value: -120, key: 10},
      {value: -123, key: 11},
      {value: -100, key: 12},
      {value: -222, key: 13},
      {value: -120, key: 14},
    ];
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
