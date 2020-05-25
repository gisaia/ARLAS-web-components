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
import { formatWithSpace } from '../componentsUtils';

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
  public displayedValue = '0';

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
    if (precision === 0) {
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
      this.displayedValue = this.intToString(Math.round(this.value));
    } else {
      const v = MetricComponent.round(this.value, this.valuePrecision);
      this.displayedValue = formatWithSpace(v);
    }
  }
  private intToString(value: number): string {
    let newValue = value.toString();
    if (value >= 1000) {
      const suffixes = ['', 'k', 'M', 'b', 't'];
      const suffixNum = Math.floor(('' + value).length / 3);
      let shortValue: number;
      for (let precision = 3; precision >= 1; precision--) {
        shortValue = parseFloat((suffixNum !== 0 ? (value / Math.pow(1000, suffixNum)) : value)
          .toPrecision(precision));
        const dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
        if (dotLessShortValue.length <= 2) { break; }
      }
      let shortNum = shortValue.toString();
      if (shortValue % 1 !== 0) {
        shortNum = shortValue.toFixed(1);
      }
      newValue = shortNum + suffixes[suffixNum];
    }
    return newValue.toString();
  }

}
