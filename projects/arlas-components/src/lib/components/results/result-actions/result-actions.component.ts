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

import { Component, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Item } from '../model/item';
import { Action, ActionHandler } from '../utils/results.utils';
import { filter, Subject, take, takeUntil } from 'rxjs';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { ResultlistNotifierService } from '../../../services/resultlist.notifier.service';

@Component({
  selector: 'arlas-result-actions',
  templateUrl: './result-actions.component.html',
  styleUrls: ['./result-actions.component.scss']
})
export class ResultActionsComponent implements OnInit, OnChanges, OnDestroy {

  @Input() public item: Item;
  @Input() public width: number;
  @Input() public activatedActionsPerItem: Map<string, Set<string>> = new Map<string, Set<string>>();
  @Input() public detailedDataRetriever: DetailedDataRetriever = null;
  @Input() public stopPropagation = false;
  @Input() public mode: 'icon' | 'text' = 'icon';
  @Output() public actionOnItemEvent: Subject<Action> = new Subject<Action>();
  
  /** Destroy subscriptions */
  private _onDestroy$ = new Subject<boolean>();

  public actions: Action[];

  public constructor(private notifier: ResultlistNotifierService) {
    this.notifier.itemHovered$.pipe(takeUntil(this._onDestroy$)).pipe(filter((i: Item) => i.identifier === this.item.identifier)).subscribe({
      next: (i: Item) => {
        this.actions.filter(a => !ActionHandler.isReversible(a)).forEach(a => a.show = true);
        this.actions.filter(a => ActionHandler.isReversible(a) && a.fields && a.show === undefined).forEach(a => {
          this.detailedDataRetriever.getValues(i.identifier, a.fields).pipe(take(1)).subscribe({
            next: (values: string[]) => a.show = values.filter(v => !v).length === 0 
          })
        });
        console.log('hovering this um', i.identifier)
      }
    })
  }

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
            a.show = true;
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
            icon: action.icon,
            fields: action.fields,
            show: action.show
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

  public ngOnDestroy(): void {
    this._onDestroy$.next(true);
    this._onDestroy$.complete();
  }
}
