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

import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Item } from '../model/item';
import { Action } from '../utils/results.utils';
import { Observable } from 'rxjs';

export class ItemComponent {

  /**
   * @description Emits the retrieved detailed data.
   */
  protected retrievedDataEvent: Observable<{ details: Map<string, Map<string, string>>, actions: Array<Action> }>;

  public setSelectedItem(isChecked: Boolean, identifier: string, selectedItems: Set<string>) {
    isChecked = !isChecked;
    if (isChecked) {
      if (!selectedItems.has(identifier)) {
        selectedItems.add(identifier);
      }
    } else {
      if (selectedItems.has(identifier)) {
        selectedItems.delete(identifier);
      }
    }
  }

  public retrieveDetailedData(detailedDataRetriever: DetailedDataRetriever, item: Item) {
    if (detailedDataRetriever !== null && item.itemDetailedData.length === 0) {
      this.retrievedDataEvent = detailedDataRetriever.getData(((String)(item.identifier)));
      this.retrievedDataEvent.subscribe(value => {
        item.actions = new Array<Action>();
        value.actions.forEach(action => {
          item.actions.push({
            id: action.id,
            label: action.label,
            actionBus: action.actionBus,
            cssClass: action.cssClass,
            tooltip: action.tooltip
          });
        });
        value.details.forEach((v, k) => {
          const details: Array<{ key: string, value: string }> = new Array<{ key: string, value: string }>();
          v.forEach((value, key) => details.push({ key: key, value: value }));
          item.itemDetailedData.push({ group: k, details: details });
        });
      });
    }
  }
}
