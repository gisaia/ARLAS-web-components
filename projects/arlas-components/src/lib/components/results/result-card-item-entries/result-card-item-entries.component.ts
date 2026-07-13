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
import {Component, effect, input, signal, untracked} from '@angular/core';
import {Item} from '../model/item';
import {MetaBadge, CardResultItemMetadataEntryComponent} from '../result-metadata-entry/card-result-item-metadata-entry.component';
import {CardViewEntry} from '../model/cardViewEntry';

@Component({
  selector: 'arlas-result-card-item-entries',
  imports: [
    CardResultItemMetadataEntryComponent
  ],
  templateUrl: './result-card-item-entries.component.html',
  styleUrl: './result-card-item-entries.component.scss'
})
export class ResultCardItemEntriesComponent {
  /** Item containing the data to display */
  public item = input.required<Item>();
  /** Card fields to display as badges */
  public fields = input<CardViewEntry[][]>([]);
  /** Character used to separate items */
  public spacingChar = input<string>('•');
  public emptyValue = input<string>('-');
  public metaDataEntries = signal<MetaBadge[][]>([]);

  /** Separator used in tooltip (e.g., fieldName : value) */
  public readonly TOOLTIP_VALUE_SPACER = ' : ';

  public constructor() {

    effect((() => {
      const entries = this.createCardEntries();
      untracked(() =>{
        this.metaDataEntries.set(entries);
      });
    })
  );
  }

  /**
   * Create entries based on the provided fields and item data.
   * Uses guard clauses to validate data, only wraps DOM/service operations in try-catch.
   * @returns An array of MetaBadge objects representing the badges to display
   */
  public createCardEntries() {
    // Guard: Validate prerequisites
    if (!this.item()?.itemData || !this.fields()?.length) {
      return [];
    }

    return this.fields().map(cardViewEntry => cardViewEntry.map<MetaBadge>(field => {
      const value = this.item().itemData.get(`${field.fieldName}_${field.prettyName}_${field?.icon}_card`) ?? this.emptyValue();
      const hasValue = value !== this.emptyValue();
      return {
        value,
        icon: field?.icon,
        unit: field?.dataType,
        tooltip: `${field.prettyName}${this.TOOLTIP_VALUE_SPACER}${value}
        ${hasValue ? (field?.dataType || '') : ''}`
      };
    }));
  }
}
