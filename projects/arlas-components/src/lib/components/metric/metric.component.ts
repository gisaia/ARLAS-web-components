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

import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as metricJsonSchema from './metric.schema.json';
import { NUMBER_FORMAT_CHAR } from '../componentsUtils';


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
export class MetricComponent implements OnInit, OnChanges {


  @Input() public beforeValue = '';
  @Input() public value: number;
  @Input() public afterValue = '';
  @Input() public customizedCssClass: string;
  @Input() public valuePrecision = 2;
  @Input() public shortValue = false;
  @Input() public approximateValue = false;

  /**
   * @Input : Angular
   * @description Chart's width. If not specified, the chart takes the component's container width.
   */
  @Input() public chartWidth = null;

  public displayedValue: string | number = '0';
  public NUMBER_FORMAT_CHAR = NUMBER_FORMAT_CHAR;

  constructor() { }

  public ngOnInit() {
    if (this.value) {
      this.setDisplayedValue();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      if (this.value !== undefined && this.value !== NaN) {
        this.setDisplayedValue();
      } else {
        /** '-' will be set when `value` is undefined or not a number */
        this.displayedValue = '-';
      }
    }
  }

  /**
   * @returns Json schema of the donut component for configuration
   */
  public static getMetricJsonSchema(): Object {
    return metricJsonSchema;
  }



  public static round(value, precision): number {
    let multiplier;
    if (precision === 0 || precision === undefined) {
      return Math.round(value);
    } else {
      multiplier = Math.pow(10, precision * 10 || 0);
      return +(Math.round(value * multiplier) / multiplier).toFixed(precision);
    }
  }

  /**
   * sets the value displayed in html
   */
  private setDisplayedValue(): void {
    if (this.shortValue) {
      this.displayedValue = this.numberToShortValue(this.value, this.valuePrecision);
    } else {
      this.displayedValue = MetricComponent.round(this.value, this.valuePrecision);
    }
  }

  private numberToShortValue(number: number, p?: number): string {
    // what tier? (determines SI symbol)
    const suffixes = ['', 'k', 'M', 'b', 't'];
    const suffixNum = Math.log10(Math.abs(number)) / 3 | 0;

    if (suffixNum === 0) {
      return number.toString();
    }
    // get suffix and determine scale
    const suffix = suffixes[suffixNum];
    const scale = Math.pow(10, suffixNum * 3);
    // scale the number
    const scaled = number / scale;
    // format number and add suffix
    return scaled.toFixed(p) + suffix;
  }

}
