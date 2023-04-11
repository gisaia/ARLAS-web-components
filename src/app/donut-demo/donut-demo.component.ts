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
  selector: 'arlas-donut-demo',
  templateUrl: './donut-demo.component.html',
  styleUrls: ['./donut-demo.component.css']
})
export class DonutDemoComponent implements OnInit {

  public donutData = null;
  public selectedNodes;

  public constructor() { }

  public ngOnInit() {
    this.donutData = {
      fieldValue: 'root',
      fieldName: 'root',
      size: 400,
      children : [
        {
          fieldValue: 'sentinelle',
          fieldName: 'satellites',
          size: 230,
          children : [
            {
              fieldValue: 'sentinelle1',
              fieldName: 'mission',
              size: 100
            },
            {
              fieldValue: 'sentinelle2',
              fieldName: 'mission',
              size: 130
            }
          ]
        },
        {
          fieldValue: 'SPOT',
          fieldName: 'satellites',
          size: 170,
          children : [
            {
              fieldValue: 'SPOT5',
              fieldName: 'mission',
              size: 30
            },
            {
              fieldValue: 'SPOT6',
              size: 140,
              fieldName: 'mission',
              children : [
                {
                  fieldValue: 'FR1',
                  fieldName: 'emetteur',
                  size: 10
                },
                {
                  fieldValue: 'FR2',
                  fieldName: 'emetteur',
                  size: 130
                }
              ]
            },
            {
              fieldValue: 'SPOT7',
              fieldName: 'mission',
              size: 240,
              children : [
                {
                  fieldValue: 'FR1',
                  fieldName: 'emetteur',
                  size: 20
                },
                {
                  fieldValue: 'FR2',
                  fieldName: 'emetteur',
                  size: 110
                },
                {
                  fieldValue: 'FR3',
                  fieldName: 'emetteur',
                  size: 110
                }
              ]
            }
          ]
        }

      ]
    };

    setTimeout(() => {
      // this.selectedNodes = [[{fieldName: 'mission', fieldValue: 'SPOT5'}, {fieldName: 'satellites', fieldValue: 'SPOT'}]];
      this.donutData = {
        fieldName: 'root',
        fieldValue: 'root',
        size: 530,
        children : [
          {
            fieldValue: 'sentinelle',
            fieldName: 'satellites',
            size: 230,
            children : [
              {
                fieldValue: 'sentinelle1',
                fieldName: 'mission',
                size: 100
              },
              {
                fieldValue: 'sentinelle2',
                fieldName: 'mission',
                size: 130
              }
            ]
          },
          {
            fieldValue: 'SPOT',
            size: 300,
            fieldName: 'satellites',
            children : [
              {
                fieldValue: 'SPOT5',
                fieldName: 'mission',
                size: 30
              },
              {
                fieldValue: 'SPOT6',
                size: 140,
                fieldName: 'mission',
                children : [
                  {
                    fieldValue: 'FR1',
                    fieldName: 'emetteur',
                    size: 10
                  },
                  {
                    fieldValue: 'FR2',
                    fieldName: 'emetteur',
                    size: 130
                  }
                ]
              },
              {
                fieldValue: 'SPOT7',
                size: 130,
                fieldName: 'mission',
                children : [
                  {
                    fieldValue: 'FR1',
                    fieldName: 'emetteur',
                    size: 20
                  },
                  {
                    fieldValue: 'FR2',
                    fieldName: 'emetteur',
                    size: 50
                  },
                  {
                    fieldValue: 'FR3',
                    fieldName: 'emetteur',
                    size: 60
                  }
                ]
              }
            ]
          }

        ]
      };
    }, 3000);


  }

}
