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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output, Renderer2,
  ViewChild
} from '@angular/core';
import { PowerbarModule } from '../powerbars/powerbar/powerbar.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass, NgForOf, NgIf, UpperCasePipe } from '@angular/common';
import { PowerBar } from '../powerbars/model/powerbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MetricsTableRowComponent } from './multi-bars-row/metrics-table-row.component';
import * as tinycolor from 'tinycolor2';
import { ArlasColorService } from '../../services/color.generator.service';
import { FormatLongTitlePipe } from '../../pipes/format-title/format-long-title.pipe';
import * as metricTableJsonSchema from './metrics-table.schema.json';
import { FilterOperator } from '../../tools/models/term-filters';

export interface MetricsTable {
  header: MetricsTableHeader[];
  data: MetricsTableRow[];
}

export interface MetricsTableHeader {
  title: string;
  subTitle: string;
  metric: string;
  span?: number;
}

export interface MetricsTableData {
  value: number;
  maxValue: number;
}

export interface MetricsTableRow {
  term: string;
  data: MetricsTableData[];
  selected?: boolean;
}

@Component({
  selector: 'arlas-metrics-table',
  templateUrl: './metrics-table.component.html',
  styleUrls: ['./metrics-table.component.scss'],
  imports: [
    PowerbarModule,
    MatTooltipModule,
    NgForOf,
    NgClass,
    NgIf,
    UpperCasePipe,
    MatCheckboxModule,
    TranslateModule,
    MetricsTableRowComponent,
    FormatLongTitlePipe
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsTableComponent implements OnInit, AfterViewInit {
  /**
   * @Input : Angular
   * @description Data to build the table.
   */
  @Input() public multiBarTable: MetricsTable;

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
   * @description Default term selected.
   */
  @Input() public defaultSelection: string[] = ['pneo'];

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
   * @description Whether to allow colorizing the bar according to its column term or row term
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
   * @description Allow to select display mode for this component
   */
  @Input() public headerDisplayMode: 'indicator' | 'titleOnly' | 'full' = 'indicator';


  @Output() public onSelect = new EventEmitter();

  @ViewChild('tableHeader') protected header: ElementRef;


  // keep it time complexity o(1) with get.
  protected powerBarsList: Map<number, PowerBar[]> = new Map();
  protected selectedKey: Set<string> = new Set();
  protected pendingMode = false;
  protected shortcutColor = [];
  protected titleAreDifferent = true;
  protected uniqueTitles: MetricsTableHeader[];
  protected tbodyHeight: string;

  public constructor(private colorService: ArlasColorService, private render: Renderer2) {
    this.colorService.changekeysToColors$.subscribe(() => {
      this.powerBarsList.forEach(powerbarsRow => {
        powerbarsRow.forEach(p => {
          if (this.useColorService) {
            this.defineColor(p.term);
          }
        });
      });
    });
  }

  public ngOnInit(): void {
    if (this.multiBarTable) {
      this.buildPowerBars();
      this.buildHeaders();
    }
  }

  public ngAfterViewInit(){
    this.tbodyHeight = `calc(100% - ${this.header.nativeElement.offsetHeight}px`;
  }

  public buildHeaders(){
    this.uniqueTitles = [];
    this.multiBarTable.header.forEach(header => {
      const includes = this.uniqueTitles.find(includeHeader => includeHeader.title === header.title);
      if(!includes) {
        header.span = 1;
        this.uniqueTitles.push(header);
      } else {
        includes.span++;
      }
      this.shortcutColor.push(this.defineColor(header.title));
    });
    this.titleAreDifferent = this.uniqueTitles.length === this.multiBarTable.data[0].data.length;
    if(!this.titleAreDifferent) {
    }
  }

  public buildIndicators() {
    this.powerBarsList.forEach(powerBarList => {
      if (!this.useColorService && !this.keysToColors || this.applyColorTo === 'row') {
        this.shortcutColor.push('#88c9c3');
      } else {
        powerBarList.forEach(powerBars => {
          this.shortcutColor.push(powerBars.color);
        });
      }
    });
  }

  public buildPowerBars() {
    this.multiBarTable.data.forEach((merticsRow, rowIndex) => {
      this.powerBarsList.set(rowIndex, []);
      merticsRow.data.forEach((item, i) => {
        let powerBar;
        if (this.applyColorTo === 'row') {
          powerBar = new PowerBar(merticsRow.term, merticsRow.term, item.value);
        } else if (this.applyColorTo === 'column') {
          const header = this.multiBarTable.header[i];
          powerBar = new PowerBar(header.title, header.title, item.value);
        }
        powerBar.progression = (item.value / item.maxValue) * 100;
        if(this.useColorService) {
          powerBar.color = this.defineColor(powerBar.term);
        }
        this.powerBarsList.get(rowIndex).push(powerBar);
      });
    });
  }


  public addRowItem(key: string) {
    this.sendKeys(key);
    this.togglePendingMode();
  }

  public sendKeys(key: string) {
    if (this.selectedKey.has(key)) {
      this.selectedKey.delete(key);
    } else {
      this.selectedKey.add(key);
    }
    this.onSelect.emit(this.selectedKey);
  }

  public togglePendingMode() {
    this.pendingMode = this.selectedKey.size !== 0;
  }

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
