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

import { Component, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Item } from '../model/item';
import { Action, ActionHandler } from '../utils/results.utils';
import { Subject, take } from 'rxjs';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';

@Component({
  selector: 'arlas-result-actions',
  templateUrl: './result-actions.component.html',
  styleUrls: ['./result-actions.component.scss']
})
export class ResultActionsComponent implements OnInit, OnChanges {

  @Input() public item: Item;
  @Input() public width: number;
  @Input() public activatedActionsPerItem: Map<string, Set<string>> = new Map<string, Set<string>>();
  @Input() public detailedDataRetriever: DetailedDataRetriever = null;
  @Input() public stopPropagation = false;
  @Input() public mode: 'icon' | 'text' = 'icon';
  @Output() public actionOnItemEvent: Subject<Action> = new Subject<Action>();
  
  public actions: Action[];

  public ngOnInit(): void {
    this.setItemActions(this.item);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.activatedActionsPerItem) {
      this.updateActions();
    }
  }

  public triggerAction(event: Event, action: Action) {
    if (this.stopPropagation) {
      event.stopPropagation();
    }
    this.actionOnItemEvent.next(action);
    if (ActionHandler.isReversible(action) && !action.activated) {
      ActionHandler.activate(action);
    } else if (ActionHandler.isReversible(action) && action.activated) {
      ActionHandler.reverse(action);
    }
    /** Retrigger ActionDisplayerMap */
    this.actions = [...this.actions];
  }

  private updateActions() {
    if (this.activatedActionsPerItem) {
      const actionIds = this.activatedActionsPerItem.get(this.item.identifier);
      if (actionIds) {
        this.actions.filter(a => ActionHandler.isReversible(a)).forEach(a => {
          if (actionIds.has(a.id)) {
            ActionHandler.activate(a);
          } else {
            ActionHandler.reverse(a);
          }
        });
        /** Retrigger ActionDisplayerMap */
        this.actions = [...this.actions];
      }
    }
  }

  /**
   * @description set the list of actions of an item
   * @param item
   */
  private setItemActions(item: Item): void {
    if (item && (!item.actions || (item.actions && item.actions.length === 0))) {
      item.actions = new Array<Action>();
      this.detailedDataRetriever.getActions(item).pipe(take(1)).subscribe(actions => {
        actions.forEach(action => {
          item.actions.push({
            id: action.id,
            label: action.label,
            actionBus: action.actionBus,
            cssClass: action.cssClass,
            tooltip: action.tooltip,
            reverseAction: action.reverseAction,
            icon: action.icon
          });
        });
        this.actions = item.actions;
        this.updateActions();
      });
    } else if (item && item.actions && item.actions.length > 0) {
      this.actions = item.actions;
      this.updateActions();
    }
  }
}
