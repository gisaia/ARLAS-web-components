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

import { Observable } from 'rxjs';
import { Item } from '../model/item';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Action, AdditionalInfo, Attachment } from '../utils/results.utils';

export class ItemComponent {

  /**
   * @description Emits the retrieved detailed data.
   */
  protected retrievedDataEvent: Observable<AdditionalInfo>;

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

  public retrieveAdditionalInfo(detailedDataRetriever: DetailedDataRetriever, item: Item) {
    if (detailedDataRetriever !== null && item.itemDetailedData.length === 0) {
      this.retrievedDataEvent = detailedDataRetriever.getData(((String)(item.identifier)));
      this.retrievedDataEvent.subscribe(additionalInfo => {
        item.actions = new Array<Action>();
        additionalInfo.actions.forEach(action => {
          item.actions.push({
            id: action.id,
            label: action.label,
            actionBus: action.actionBus,
            cssClass: action.cssClass,
            tooltip: action.tooltip,
            reverseAction: action.reverseAction,
            icon: action.icon,
            fields: action.fields,
            show: action.show
          });
        });
        additionalInfo.details.forEach((v, k) => {
          const details: Array<{ key: string; value: string; }> = new Array<{ key: string; value: string; }>();
          v.forEach((value, key) => details.push({ key: key, value: value }));
          item.itemDetailedData.push({ group: k, details: details });
        });
        if (additionalInfo.attachments) {
          item.attachments = new Array<Attachment>();
          additionalInfo.attachments.forEach(attachment => {
            item.attachments.push({
              label: attachment.label,
              url: attachment.url,
              type: attachment.type,
              description: attachment.description,
              icon: attachment.icon
            });
          });
        }
      });
    }
  }
}
