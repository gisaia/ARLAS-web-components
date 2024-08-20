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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PowerBar } from '../../powerbars/model/powerbar';
import { MetricsTableRow } from '../model/metrics-table';


@Component({
  selector: 'arlas-multi-bars-row',
  templateUrl: './metrics-table-row.component.html',
  styleUrls: ['./metrics-table-row.component.scss']
})
export class MetricsTableRowComponent implements OnInit {
  @Input() public displayCheckBox: boolean;
  @Input() public hideSelection: boolean;
  @Input() public metricsTableRow: MetricsTableRow;
  @Input() public useColorService = false;
  @Input() public useColorFromData = false;
  @Input() public colors: string[];
  @Input() public selected: boolean; // trigger change detection
  @Input() public pendingMode = false;
  @Input() public powerBars: PowerBar[] = [];
  @Output() public rowSelected = new EventEmitter();


  public constructor() { }

  public ngOnInit(): void {

  }

  public selectRow() {
    this.updateRowState();
  }


  public onCheck() {
    this.updateRowState();
  }

  public updateRowState(){
    this.metricsTableRow.selected = !this.metricsTableRow.selected;
    this.rowSelected.emit(this.metricsTableRow.term);
  }

  /** TODO : the selection state should be saved an propagated to the parent component.
   */
}
