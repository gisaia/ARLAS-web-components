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
import { TreeNode } from 'arlas-d3';

@Component({
  selector: 'arlas-powerbars-demo',
  templateUrl: './powerbars-demo.component.html',
  styleUrls: ['./powerbars-demo.component.css']
})
export class PowerbarsDemoComponent implements OnInit {

  public powerbarsConstructors: TreeNode;

  public powerbarsCountries: TreeNode;
  public countriesTitle = 'Countries';

  public powerbarsAirlines: TreeNode;
  public airlinesTitle = 'Airlines';

  constructor() { }

  public ngOnInit() {
    this.powerbarsConstructors = {
      id: 'root',
      isOther: false,
      fieldValue: 'root',
      fieldName: 'root',
      size: 3000,
      children : [
        {
          id: 'airbus',
          fieldValue: 'Airbus',
          fieldName: 'contructors',
          size: 1000,
          metricValue: 1000,
          isOther: false
        },
        {
          id: 'Boeing',
          fieldValue: 'Boeing',
          fieldName: 'contructors',
          size: 800,
          metricValue: 800,
          isOther: false
        },
        {
          id: 'Bombardier',
          fieldValue: 'Bombardier',
          fieldName: 'contructors',
          size: 600,
          metricValue: 600,
          isOther: false
        },
        {
          id: 'Pilatus',
          fieldValue: 'Bombardier',
          fieldName: 'contructors',
          size: 600,
          metricValue: 600,
          isOther: false
        }
      ]
    };
    this.powerbarsAirlines = {
      id: 'root',
      isOther: false,
      fieldValue: 'root',
      fieldName: 'root',
      size: 5205,
      children : [
        {
          id: 'Air France',
          fieldValue: 'Air France',
          fieldName: 'airlines',
          size: 2000,
          metricValue: 2000,
          isOther: false
        },
        {
          id: 'Iberia',
          fieldValue: 'Iberia',
          fieldName: 'airlines',
          size: 1500,
          metricValue: 1500,
          isOther: false
        },
        {
          id: 'kws',
          fieldValue: 'KWS',
          fieldName: 'airlines',
          size: 1000,
          metricValue: 1000,
          isOther: false
        },
        {
          id: 'Emirates',
          fieldValue: 'Emirates',
          fieldName: 'airlines',
          size: 500,
          metricValue: 500,
          isOther: false
        },
        {
          id: 'Rynair',
          fieldValue: 'Rynair',
          fieldName: 'airlines',
          size: 200,
          metricValue: 200,
          isOther: false
        },
        {
          id: 'EasyJet',
          fieldValue: 'EasyJet',
          fieldName: 'airlines',
          size: 150,
          metricValue: 150,
          isOther: false
        }
      ]
    };

    this.powerbarsCountries = {
      id: 'root',
      isOther: false,
      fieldValue: 'root',
      fieldName: 'root',
      size: 6980,
      children : [
        {
          id: 'France',
          fieldValue: 'France',
          fieldName: 'countries',
          size: 2000,
          metricValue: 2000,
          isOther: false
        },
        {
          id: 'Germany',
          fieldValue: 'Germany',
          fieldName: 'countries',
          size: 1800,
          metricValue: 1800,
          isOther: false
        },
        {
          id: 'Switzerland',
          fieldValue: 'Switzerland',
          fieldName: 'countries',
          size: 1700,
          metricValue: 1700,
          isOther: false
        },
        {
          id: 'England',
          fieldValue: 'England',
          fieldName: 'countries',
          size: 1000,
          metricValue: 1000,
          isOther: false
        },
        {
          id: 'Italy',
          fieldValue: 'Italy',
          fieldName: 'countries',
          size: 200,
          metricValue: 200,
          isOther: false
        },
        {
          id: 'Spain',
          fieldValue: 'Spain',
          fieldName: 'countries',
          size: 180,
          metricValue: 180,
          isOther: false
        },
        {
          id: 'Portugal',
          fieldValue: 'Portugal',
          fieldName: 'countries',
          size: 100,
          metricValue: 100,
          isOther: false
        }
      ]
    };
  }

}
