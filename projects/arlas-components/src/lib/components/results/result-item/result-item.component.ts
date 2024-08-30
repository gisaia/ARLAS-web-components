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

import { Component, Input, OnInit, Output } from '@angular/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { Subject, takeUntil } from 'rxjs';
import { ArlasColorService } from '../../../services/color.generator.service';
import { NUMBER_FORMAT_CHAR } from '../../componentsUtils';
import { Item } from '../model/item';
import { ItemComponent } from '../model/itemComponent';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { CellBackgroundStyleEnum } from '../utils/enumerations/cellBackgroundStyleEnum';
import { Action, ElementIdentifier, ResultListOptions } from '../utils/results.utils';


@Component({
  selector: '[arlas-result-item]',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.scss']
})
export class ResultItemComponent extends ItemComponent implements OnInit {

  /**
   * @constant
   */
  public readonly HIDE_DETAILS = marker('Hide details');
  /**
   * @constant
   */
  public readonly SHOW_DETAILS = marker('Show details');
  public readonly CellBackgroundStyleEnum = CellBackgroundStyleEnum;

  /**
   * @Input : Angular
   * @description An input to customize the resultlist behaviour
   */
  @Input() public options: ResultListOptions;
  /**
   * @Input
   * @description An object representing an Item .
   */
  @Input() public rowItem: Item;
  /**
  * @Input
  * @description Name of the id field.
  */
  @Input() public idFieldName: string;
  /**
   * @Input
   * @description A detailed-data-retriever object that implements
   * DetailedDataRetriever interface.
   */
  @Input() public detailedDataRetriever: DetailedDataRetriever;
  /**
   * @Input
   * @description List of all selected items in the result-list.component.
   * This component sets directly this list.
   */
  @Input() public selectedItems: Set<string>;

  /**
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public keysToColors: Array<[string, string]>;

  /**
   * @Input : Angular
   * @description Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a
   * factor (between 0 and 1) that tightens this scale to [(1-colorsSaturationWeight), 1].
   * Therefore saturation of generated colors will be within this tightened scale.
   */
  @Input() public colorsSaturationWeight = 1 / 2;

  /**
   * @Input : Angular
   * @description Whether to allow colorizing the cells of the item (the row) according to the terms displayed
   */
  @Input() public useColorService = false;

  /**
   * @Input : Angular
   * @description The way the cell will be colorized: filled or outlined
   */
  @Input() public cellBackgroundStyle: CellBackgroundStyleEnum = CellBackgroundStyleEnum.filled;


  @Input() public tableWidth: number;
  /**
   * @Output
   * @description Emits the list of selected items in result-list.component.
   */
  @Output() public selectedItemsEvent = new Subject<Set<string>>();

  /**
   * @Output
   * @description Emits the event of applying the specified action on the specified item.
   */
  @Output() public actionOnItemEvent = new Subject<{ action: Action; elementidentifier: ElementIdentifier; }>();

  /**
   * @Output
   * @description Emits the selected/unselected item.
   * @deprecated
   */
  @Output() public selectedItemPositionEvent = new Subject<Item>();

  /**
   * @Output
   * @description Emits the border line style depending on the item's toggle state.
   */
  @Output() public borderStyleEvent = new Subject<string>();

  public isDetailToggled = false;
  public detailedData = '';
  public borderStyle = 'solid';
  public colors = {};
  protected identifier: string;

  public readonly NUMBER_FORMAT_CHAR = NUMBER_FORMAT_CHAR;

  private _ondestroy$ = new Subject<boolean>();

  public constructor(private colorService: ArlasColorService) {
    super();
    this.colorService.changekeysToColors$
      .pipe(takeUntil(this._ondestroy$))
      .subscribe(() => this.updateColors());
  }

  public ngOnInit() {
    this.identifier = this.rowItem?.identifier;
    this.updateColors();
  }

  public ngOnDestroy() {
    this._ondestroy$.next(true);
    this._ondestroy$.complete();
  }

  /** Detailed data is retrieved when the row is toggled for the first time */
  public toggle() {
    if (this.rowItem.isDetailToggled === false) {
      this.retrieveAdditionalInfo(this.detailedDataRetriever, this.rowItem);
      this.borderStyle = 'dashed';
    } else {
      this.borderStyle = 'solid';
    }
    this.borderStyleEvent.next(this.borderStyle);
    this.rowItem.isDetailToggled = !this.rowItem.isDetailToggled;

  }

  /** Update the list of the selected items */
  public setSelectedItem() {
    if (this.rowItem.isindeterminated) {
      this.rowItem.isChecked = true;
      this.rowItem.isindeterminated = false;
      this.selectedItems.add(this.identifier);
    } else {
      super.setSelectedItem(this.rowItem.isChecked, this.identifier, this.selectedItems);
      this.rowItem.isChecked = !this.rowItem.isChecked;
    }

    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in grid mode
    this.selectedItemsEvent.next(this.selectedItems);
  }

  public getTextColor(key): string {
    if (key !== undefined && key !== null) {
      return this.colorService.getTextColor(key.toString());
    } else {
      return '';
    }
  }

  public triggerActionOnItem(action: Action) {
    this.actionOnItemEvent.next({ action: action, elementidentifier: { idFieldName: this.idFieldName, idValue: this.identifier } });
  }

  // TODO: can't it be replaced by the colorService ?
  private updateColors() {
    const newColor = {};
    this.rowItem?.columns.forEach(c => {
      if (c.useColorService){
        const key = this.rowItem?.itemData.get(c.fieldName);
        if (key !== undefined && key !== null) {
          newColor[key.toString()] = {};
          newColor[key.toString()]['color'] = this.getColor(key);
          newColor[key.toString()]['textColor'] = this.getTextColor(key);

        }
      }
    });
    this.colors = newColor;
  }

  private getColor(key): string {
    if (key !== undefined && key !== null) {
      return this.colorService.getColor(key.toString(), this.keysToColors, this.colorsSaturationWeight);
    } else {
      return '';
    }
  }



}
