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
import { Granularity } from 'arlas-d3';
import { Subject } from 'rxjs';

// TODO: add data to properly test component

@Component({
  selector: 'arlas-calendar-timeline-demo',
  templateUrl: './calendar-timeline-demo.component.html',
  styleUrls: ['./calendar-timeline-demo.component.css']
})
export class CalendarTimelineDemoComponent {
  public granularity: Subject<Granularity> = new Subject();

  public constructor() { }

  public day() {
    this.granularity.next(Granularity.day);
  }


  public month() {
    this.granularity.next(Granularity.month);
  }

}
