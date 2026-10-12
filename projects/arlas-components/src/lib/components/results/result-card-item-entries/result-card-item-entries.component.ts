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
import { Component, effect, input, signal, untracked } from '@angular/core';
import { buildCardItemField } from '../../../pipes/get-item-data-value/get-item-data-value.pipe';
import { CardField } from '../model/cardField';
import { Item } from '../model/item';
import { CardResultItemMetadataEntryComponent, MetaDataEntry } from '../result-metadata-entry/card-result-item-metadata-entry.component';

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
  /** Card fields to display as metadata */
  public fields = input<CardField[][]>([]);
  /** Character used to separate items */
  public spacingChar = input<string>('•');
  public emptyValue = input<string>('-');
  public metaDataEntries = signal<MetaDataEntry[][]>([]);

  /** Separator used in tooltip (e.g., fieldName : value) */
  public readonly TOOLTIP_VALUE_SPACER = ' : ';

  public constructor() {

    effect((() => {
      const entries = this.createCardMetadata();
      untracked(() =>{
        this.metaDataEntries.set(entries);
      });
    })
  );
  }

  /**
   * Create entries based on the provided fields and item data.
   * Uses guard clauses to validate data, only wraps DOM/service operations in try-catch.
   * @returns An array of metadata objects representing the data to display
   */
  public createCardMetadata() {
    // Guard: Validate prerequisites
    if (!this.item()?.itemData || !this.fields()?.length) {
      return [];
    }

    return this.fields().map(cardFields => cardFields.map<MetaDataEntry>(field => {
      const value = this.item().itemData.get(buildCardItemField(field)) ?? this.emptyValue();
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
