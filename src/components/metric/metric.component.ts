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

import { Component, OnInit, Input } from '@angular/core';
import * as metricJsonSchema from './metric.schema.json';

@Component({
  selector: 'arlas-metric',
  templateUrl: './metric.component.html',
  styleUrls: ['./metric.component.css']
})
/**
 * This component will contain a phrase composed of 3 parts
 * - beforeValue = `Speed average : `
 * - value = `25`
 * - afterValue = ` km/h`.
 * The phrase that will be represented in this card is : **Speed average : 25 km/h**
 *
 */
export class MetricComponent implements OnInit {

  @Input() public beforeValue: string;
  @Input() public value: number;
  @Input() public afterValue: string;
  @Input() public customizedCssClass: string;
  @Input() public valuePrecision = 2;
  public roundedValue = this.value;



  constructor() { }

  public ngOnInit() {
    this.roundedValue = this.getValue();

  }

  /**
   * @returns Json schema of the donut component for configuration
   */
  public static getDonutJsonSchema(): Object {
    return metricJsonSchema;
  }

  public getValue() {
    return MetricComponent.round(this.value, this.valuePrecision);
  }

  public static round(value, precision): number {
    let multiplier;
    if (precision === 0) {
      return Math.round(value);
    } else {
      multiplier = Math.pow(10, precision * 10 || 0);
      return +(Math.round(value * multiplier) / multiplier).toFixed(precision);
    }
  }

}
