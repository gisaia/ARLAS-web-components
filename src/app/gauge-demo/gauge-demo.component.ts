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

@Component({
  selector: 'arlas-gauge-demo',
  templateUrl: './gauge-demo.component.html',
  styleUrls: ['./gauge-demo.component.css']
})
export class GaugeDemoComponent implements OnInit {

  public maxValue = 1e10;
  public threshold = 1e8;
  public currentValue = 1e5;

  constructor() { }

  public ngOnInit() {
    this.maxValue = this.generateRandomInteger(1e9, 1e10);
    this.threshold = this.generateRandomInteger(1e6, 1e8);
    this.currentValue = this.generateRandomInteger(1e3, 1e5);
  }


  public updateData() {
    this.maxValue = this.generateRandomInteger(1e9, 1e10);
    this.threshold = this.generateRandomInteger(1e6, 1e8);
    this.currentValue = this.generateRandomInteger(1e3, 1e5);

  }

  public generateRandomInteger(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }

}
