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

import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { first, interval } from 'rxjs';
import { Item } from '../model/item';
import { DEFAULT_TASK_RETRIEVAL_INTERVAL, TaskSettingsService, TaskStatus } from '../utils/aias-process';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Action, Attachment } from '../utils/results.utils';

@Component({
  template: ''
})
export class ItemComponent {
  private readonly taskSettingsService = inject(TaskSettingsService);
  private readonly destroyRef = inject(DestroyRef);

  public setSelectedItem(isChecked: boolean, identifier: string, selectedItems: Set<string>) {
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
    if (detailedDataRetriever && item.itemDetailedData.length === 0) {
      detailedDataRetriever.getData(item.identifier)
        .subscribe(additionalInfo => {
          item.actions = new Array<Action>();
          additionalInfo.actions?.forEach(action => {
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
          additionalInfo.details?.forEach((v, k) => {
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

    this.retrieveTasks(detailedDataRetriever, item);
  }

  /**
   * Retrieves the AIAS tasks linked to this item's id
   * @param detailedDataRetriever
   * @param item
   */
  public retrieveTasks(detailedDataRetriever: DetailedDataRetriever, item: Item) {
    if (detailedDataRetriever) {
      item.tasks = new Map();
      const taskMap$ = detailedDataRetriever.getAllTasks(item.identifier);
      taskMap$.forEach((t$, service) => {
        t$.pipe(first()).subscribe(tasks => {
          item.tasks.set(service, tasks);
          this.checkTaskCompletion(detailedDataRetriever, item, service);
        });
      });
    }
  }

  /**
   * If one of the tasks of the service is not complete, then periodically checks until all of them are complete
   * @param detailedDataRetriever
   * @param item
   * @param service
   */
  private checkTaskCompletion(detailedDataRetriever: DetailedDataRetriever, item: Item, service: string) {
    const serviceTasks = item.tasks.get(service) ?? [];
    if (serviceTasks.some(t => t.status === TaskStatus.accepted || t.status === TaskStatus.running)) {
      const obs$ = interval(this.taskSettingsService.getServiceTaskSettings(service)?.taskRetrievalTimer ?? DEFAULT_TASK_RETRIEVAL_INTERVAL)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(_ => {
          detailedDataRetriever.getServiceTasks(item.identifier, service)
            .pipe(first())
            .subscribe(tasks => {
              item.tasks.set(service, tasks);

              // If all tasks are in a final state, then stop retrieving updated state
              if (tasks.filter(t => t.status === TaskStatus.accepted || t.status === TaskStatus.running).length === 0) {
                obs$.unsubscribe();
              }
            });
          });
    }
  }
}
