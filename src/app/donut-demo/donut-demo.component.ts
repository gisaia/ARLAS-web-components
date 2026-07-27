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

import { Component } from '@angular/core';
import { TreeNode } from 'arlas-d3';
import { DonutComponent } from 'arlas-web-components';

@Component({
    selector: 'arlas-donut-demo',
    templateUrl: './donut-demo.component.html',
    styleUrls: ['./donut-demo.component.css'],
    imports: [DonutComponent]
})
export class DonutDemoComponent {

  public donutData: TreeNode;

  public constructor() {
    this.donutData = {
      fieldValue: 'root',
      fieldName: 'root',
      size: 400,
      id: 'root',
      isOther: false,
      children : [
        {
          fieldValue: 'sentinel',
          fieldName: 'satellites',
          size: 230,
          children : [
            {
              fieldValue: 'sentinel1',
              fieldName: 'mission',
              size: 100,
              id: 'sentinel1',
              isOther: false
            },
            {
              fieldValue: 'sentinel2',
              fieldName: 'mission',
              size: 130,
              id: 'sentinel2',
              isOther: false
            }
          ],
          id: 'sentinel',
          isOther: false
        },
        {
          fieldValue: 'SPOT',
          fieldName: 'satellites',
          size: 170,
          children : [
            {
              fieldValue: 'SPOT5',
              fieldName: 'mission',
              size: 30,
              id: 'SPOT5',
              isOther: false
            },
            {
              fieldValue: 'SPOT6',
              size: 140,
              fieldName: 'mission',
              children : [
                {
                  fieldValue: 'FR1',
                  fieldName: 'emetteur',
                  size: 10,
                  id: 'FR1',
                  isOther: false
                },
                {
                  fieldValue: 'FR2',
                  fieldName: 'emetteur',
                  size: 130,
                  id: 'FR2',
                  isOther: false
                }
              ],
              id: 'SPOT6',
              isOther: false
            },
            {
              fieldValue: 'SPOT7',
              fieldName: 'mission',
              size: 240,
              children : [
                {
                  fieldValue: 'FR1',
                  fieldName: 'emetteur',
                  size: 20,
                  id: 'FR1',
                  isOther: false
                },
                {
                  fieldValue: 'FR2',
                  fieldName: 'emetteur',
                  size: 110,
                  id: 'FR2',
                  isOther: false
                },
                {
                  fieldValue: 'FR3',
                  fieldName: 'emetteur',
                  size: 110,
                  id: 'FR3',
                  isOther: false
                }
              ],
              id: 'SPOT7',
              isOther: false
            }
          ],
          id: 'SPOT',
          isOther: false
        }
      ]
    };

    // setTimeout(() => {
    //   this.donutData = {
    //     fieldName: 'root',
    //     fieldValue: 'root',
    //     size: 530,
    //     children : [
    //       {
    //         fieldValue: 'sentinelle',
    //         fieldName: 'satellites',
    //         size: 230,
    //         children : [
    //           {
    //             fieldValue: 'sentinelle1',
    //             fieldName: 'mission',
    //             size: 100
    //           },
    //           {
    //             fieldValue: 'sentinelle2',
    //             fieldName: 'mission',
    //             size: 130
    //           }
    //         ]
    //       },
    //       {
    //         fieldValue: 'SPOT',
    //         size: 300,
    //         fieldName: 'satellites',
    //         children : [
    //           {
    //             fieldValue: 'SPOT5',
    //             fieldName: 'mission',
    //             size: 30
    //           },
    //           {
    //             fieldValue: 'SPOT6',
    //             size: 140,
    //             fieldName: 'mission',
    //             children : [
    //               {
    //                 fieldValue: 'FR1',
    //                 fieldName: 'emetteur',
    //                 size: 10
    //               },
    //               {
    //                 fieldValue: 'FR2',
    //                 fieldName: 'emetteur',
    //                 size: 130
    //               }
    //             ]
    //           },
    //           {
    //             fieldValue: 'SPOT7',
    //             size: 130,
    //             fieldName: 'mission',
    //             children : [
    //               {
    //                 fieldValue: 'FR1',
    //                 fieldName: 'emetteur',
    //                 size: 20
    //               },
    //               {
    //                 fieldValue: 'FR2',
    //                 fieldName: 'emetteur',
    //                 size: 50
    //               },
    //               {
    //                 fieldValue: 'FR3',
    //                 fieldName: 'emetteur',
    //                 size: 60
    //               }
    //             ]
    //           }
    //         ]
    //       }

    //     ]
    //   };
    // }, 3000);
  }
}
