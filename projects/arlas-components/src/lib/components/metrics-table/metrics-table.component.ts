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

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { KeyValue } from '@angular/common';
import { PowerBar } from '../powerbars/model/powerbar';
import * as tinycolor from 'tinycolor2';
import { ArlasColorService } from '../../services/color.generator.service';
import * as metricTableJsonSchema from './metrics-table.schema.json';
import { FilterOperator } from '../../tools/models/term-filters';
import { MetricsTable, MetricsTableHeader, MetricsTableRow } from './model/metrics-table';


@Component({
  selector: 'arlas-metrics-table',
  templateUrl: './metrics-table.component.html',
  styleUrls: ['./metrics-table.component.scss']
})
export class MetricsTableComponent implements OnInit, OnChanges {
  /**
   * @Input : Angular
   * @description Data to build the table.
   */
  @Input() public metricsTable: MetricsTable;

  /**
     * @Input : Angular
     * @description Options about how to apply filters on metrics table
     * - value : The default value.
     *           if 'Eq', the selected line is included in the ARLAS filter.
     *           if 'Neq', the selected line is excluded in the ARLAS filter.
     * - display: Whether to display a switcher between 'Eq' and 'Neq' or keep the default operator all the time
     */
  @Input() public filterOperator: FilterOperator = {
    value: 'Eq',
    display: true
  };
  /**
   * @Output : Angular
   * @description Emits the filter operator
   */
  @Output() public filterOperatorEvent: EventEmitter<'Neq' | 'Eq'> = new EventEmitter();

  /**
   * @Input : Angular
   * @description selected terms list.
   */
  @Input() public selectedTerms: string[];

  /**
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public keysToColors: Array<[string, string]>;


  /**
   * @Input : Angular
   * @description Whether to allow colorizing the bar according to its term or not using keysToColors
   */
  @Input() public useColorService = false;

  /**
   * @Input : Angular
   * @description Choose how to apply colors to the table. By column : all the bars in same column will have the same color.
   * By row : all the bars in the same row, will have the same color.
   */
  @Input() public applyColorTo: 'column' | 'row' = 'column';

  /**
   * @Input : Angular
   * @description Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a
   * factor (between 0 and 1) that tightens this scale to [(1-colorsSaturationWeight), 1].
   * Therefore saturation of generated colors will be within this tightened scale.
   */
  @Input() public colorsSaturationWeight;

  /**
   * @description Allow to select a row by a checkbox
   */
  @Input() public selectWithCheckbox = true;

  /**
   * @description Allow to select display mode for headers.
   */
  @Input() public headerDisplayMode: 'chip' | 'title' | 'full' = 'chip';

  /**
   * @description Normalise bars progression based on the maximum value of each column OR of the whole table
   */
  @Input() public normaliseBy: 'column' | 'table' = 'table';
  @Input() public showRowField = true;

  @Output() public onSelect = new EventEmitter<Set<string>>();

  @ViewChild('tableHeader') protected header: ElementRef;


  // keep it time complexity o(1) with get.
  /** Map of <term-list.of.powerbars.corresponding.to.this.term.> */
  protected powerBarsMap: Map<string, PowerBar[]> = new Map();
  protected selectedKeys: Set<string> = new Set();
  protected selectedRows: Map<string, MetricsTableRow> = new Map();
  protected pendingMode = false;
  protected titleAreDifferent = true;
  protected uniqueTitles: MetricsTableHeader[];


  public constructor(private readonly colorService: ArlasColorService, private readonly cdr: ChangeDetectorRef) {
    this.colorService.changekeysToColors$.subscribe(() => {
      this.powerBarsMap.forEach(powerbarsRow => {
        powerbarsRow.forEach(p => {
          if (this.useColorService) {
            this.defineColor(p.term);
          }
        });
      });
    });
  }

  public ngOnInit(): void {
    if (this.metricsTable) {
      this.updateSelectedTermWithDefaultValue();
      this.buildPowerBars();
      this.buildHeaders();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.metricsTable) {
      if (this.metricsTable !== undefined && this.metricsTable !== null) {
        this.ngOnInit();
      }
    }
    if (changes.selectedTerms) {
      this.updateSelection(this.selectedTerms);
    }
  }

  public buildHeaders() {
    this.uniqueTitles = [];
    let previousId = '';
    let nextIndex = 0;
    this.metricsTable.header.forEach((header, i) => {
      header.color = this.defineColor(header.title);
      const currentId = header.title + header.rowfield;
      if (currentId !== previousId) {
        header.span = 1;
        this.uniqueTitles.push(header);
        nextIndex++;
        previousId = currentId;
      } else {
        this.uniqueTitles[nextIndex - 1].span++;
      }
    });
    this.titleAreDifferent = this.uniqueTitles.length === this.metricsTable?.data[0]?.data.length;

  }

  private updateSelectedTermWithDefaultValue() {
    if (this.selectedTerms && this.selectedTerms.length > 0) {
      this.selectedTerms.forEach(selectedTerm => {
        this.selectedKeys.add(selectedTerm);
      });
    }
    this.togglePendingMode();
  }

  public buildPowerBars() {
    this.powerBarsMap.clear();
    this.clearAll();
    this.metricsTable.data?.forEach((merticsRow, rowIndex) => {
      this.powerBarsMap.set(merticsRow.term, []);
      merticsRow.data.forEach((item, i) => {
        let powerBar: PowerBar;
        if (this.applyColorTo === 'row') {
          powerBar = new PowerBar(merticsRow.term, merticsRow.term, item?.value);
        } else {
          const header = this.metricsTable.header[i];
          powerBar = new PowerBar(header.title, header.title, item?.value);
        }
        if (item) {
          let maxValue;
          if (this.normaliseBy === 'table') {
            maxValue = item.maxTableValue;
          } else {
            maxValue = item.maxColumnValue;
          }
          powerBar.progression = (item.value / maxValue) * 100;
        }
        if (this.useColorService) {
          powerBar.color = this.defineColor(powerBar.term);
        }
        if (this.selectedKeys.has(merticsRow.term)) {
          merticsRow.selected = true;
          this.selectedRows.set(merticsRow.term, merticsRow);
        }
        this.powerBarsMap.get(merticsRow.term).push(powerBar);
      });
    });
  }

  public updateSelection(keys: string[]) {
    this.selectedKeys = new Set(keys);
    this.clearAll();
    keys.forEach(key => this.updateSelectedRow(key));
    this.togglePendingMode();
  }

  public clearAll() {
    this.metricsTable?.data?.forEach(row => row.selected = false);
    this.selectedRows.clear();
  }
  public addTermToSelectedList(key: string) {
    this.updateSelectedRow(key);
    this.updateSelectedTerm(key);
    this.togglePendingMode();
  }

  public updateSelectedTerm(key: string) {
    if (this.selectedKeys.has(key)) {
      this.selectedKeys.delete(key);
    } else {
      this.selectedKeys.add(key);
    }
    this.onSelect.emit(this.selectedKeys);
  }


  public updateSelectedRow(key: string) {
    const row = this.metricsTable.data.find(row => row.term === key);
    if (this.selectedRows.has(key)) {
      row.selected = false;
      this.selectedRows.delete(key);
    } else if (row) {
        row.selected = true;
        this.selectedRows.set(key, row);
      } else {
        /** If we select a row that does not exists, it means we data is not  */
      }
  }

  public togglePendingMode() {
    this.pendingMode = this.selectedKeys.size !== 0;
  }

  public trackByFn(index, item) {
    return item.term; // Use the 'id' property as the unique identifier
  }

  // preserve order of insertion
  public originalOrder = (a: KeyValue<string, MetricsTableRow>, b: KeyValue<string, MetricsTableRow>): number => 0;

  private defineColor(key: string) {
    const rgbaColor = tinycolor.default(this.colorService.getColor(key, this.keysToColors,
      this.colorsSaturationWeight)).toRgb();
    return this.getPowerbarColor(rgbaColor);
  }

  private getPowerbarColor(rgbaColor: tinycolor.ColorFormats.RGBA): string {
    return 'rgba(' + [rgbaColor.r, rgbaColor.g, rgbaColor.b, 0.7].join(',') + ')';
  }

  public static getJsonSchema(): Object {
    return metricTableJsonSchema;
  }

  public setOperator(op: 'Eq' | 'Neq'): void {
    if (this.filterOperator.value !== op) {
      this.filterOperator.value = op;
      this.filterOperatorEvent.next(op);
    }
  }
}
